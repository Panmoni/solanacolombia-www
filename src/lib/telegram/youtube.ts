// Reads recent comments on the channel's videos through the YouTube Data API
// (free quota, API key only). The key travels only in the query string and
// never appears in an error.

/** The channel behind https://www.youtube.com/@SolanaColombia. */
export const YOUTUBE_HANDLE = 'SolanaColombia';

const API = 'https://www.googleapis.com/youtube/v3';
const REQUEST_TIMEOUT_MS = 10_000;
// Each page costs 1 quota unit of the free 10,000 a day; 5 pages = 500 comments.
const MAX_PAGES = 5;

interface CommentThreadPage {
  nextPageToken?: string;
  items?: {
    snippet?: {
      topLevelComment?: { snippet?: { textOriginal?: string; publishedAt?: string } };
    };
  }[];
}

export const createYoutubeComments = (apiKey: string, fetchImpl: typeof fetch = fetch) => {
  const get = async <T>(path: string, params: Record<string, string>): Promise<T> => {
    const query = new URLSearchParams({ ...params, key: apiKey });
    let response: Response;
    try {
      response = await fetchImpl(`${API}/${path}?${query}`, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch (error) {
      // Only the error name: a runtime's message may quote the URL, key included.
      const name = error instanceof Error ? error.name : 'unknown error';
      throw new Error(`YouTube ${path} request failed: ${name}`);
    }
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      throw new Error(
        `YouTube ${path} failed (${response.status}): ${body?.error?.message ?? 'no message'}`,
      );
    }
    return (await response.json()) as T;
  };

  /** Top-level comments published at or after `since`, newest first. */
  return async (since: Date): Promise<string[]> => {
    const channels = await get<{ items?: { id: string }[] }>('channels', {
      part: 'id',
      forHandle: YOUTUBE_HANDLE,
    });
    const channelId = channels.items?.[0]?.id;
    if (!channelId) {
      throw new Error(`YouTube channel @${YOUTUBE_HANDLE} not found`);
    }

    const comments: string[] = [];
    let pageToken: string | undefined;
    for (let page = 0; page < MAX_PAGES; page += 1) {
      const data = await get<CommentThreadPage>('commentThreads', {
        part: 'snippet',
        allThreadsRelatedToChannelId: channelId,
        order: 'time',
        textFormat: 'plainText',
        maxResults: '100',
        ...(pageToken && { pageToken }),
      });
      for (const item of data.items ?? []) {
        const comment = item.snippet?.topLevelComment?.snippet;
        const text = comment?.textOriginal?.trim();
        if (!(comment?.publishedAt && text)) {
          continue;
        }
        // order=time: the first comment older than the window ends the read.
        if (new Date(comment.publishedAt) < since) {
          return comments;
        }
        comments.push(text);
      }
      pageToken = data.nextPageToken;
      if (!pageToken) {
        break;
      }
    }
    return comments;
  };
};
