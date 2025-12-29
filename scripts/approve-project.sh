# scripts/approve-project.sh - Interactive project approval script

# Load database name
DB_NAME=$(grep -oP 'database_name = "\K[^"]+' wrangler.toml | head -1)
[ -z "$DB_NAME" ] && DB_NAME="solana_builders"

echo "--- Gestor de Aprobación de Proyectos ---"
echo "Base de Datos: $DB_NAME"

# Fetch pending projects
echo "Buscando proyectos pendientes..."
PROJECTS_JSON=$(npx wrangler d1 execute "$DB_NAME" --remote --command="SELECT id, name, owner_wallet FROM projects WHERE status = 'pending';" --format=json 2>/dev/null)

if [ $? -ne 0 ] || [ -z "$PROJECTS_JSON" ] || [ "$PROJECTS_JSON" == "[]" ]; then
    echo "✅ No hay proyectos pendientes por aprobar."
    exit 0
fi

# Parse projects into an array (using simple grep/sed for compatibility)
# Extract names and IDs
mapfile -t PROJECT_LIST < <(echo "$PROJECTS_JSON" | grep -oP '(?<="id":")[^"]+|(?<="name":")[^"]+')

# If PROJECT_LIST is empty or not as expected
if [ ${#PROJECT_LIST[@]} -eq 0 ]; then
    echo "✅ No hay proyectos pendientes por aprobar."
    exit 0
fi

echo ""
echo "Proyectos pendientes:"
declare -a IDS
declare -a NAMES

j=0
for ((i=0; i<${#PROJECT_LIST[@]}; i+=2)); do
    ID=${PROJECT_LIST[$i]}
    NAME=${PROJECT_LIST[$i+1]}
    IDS[$j]=$ID
    NAMES[$j]=$NAME
    echo "[$j] $NAME ($ID)"
    ((j++))
done

echo ""
read -p "Selecciona el número del proyecto a aprobar (o 'q' para salir): " CHOICE

if [[ "$CHOICE" == "q" ]]; then
    exit 0
fi

if [[ "$CHOICE" =~ ^[0-9]+$ ]] && [ "$CHOICE" -lt "$j" ]; then
    SELECTED_ID=${IDS[$CHOICE]}
    SELECTED_NAME=${NAMES[$CHOICE]}
    
    echo "Aprobando: $SELECTED_NAME..."
    
    npx wrangler d1 execute "$DB_NAME" --remote --command="UPDATE projects SET status = 'active', updated_at = '$(date -u +"%Y-%m-%dT%H:%M:%SZ")' WHERE id = '$SELECTED_ID';"
    
    if [ $? -eq 0 ]; then
        echo "✅ Proyecto '$SELECTED_NAME' aprobado con éxito."
    else
        echo "❌ Error al aprobar el proyecto."
    fi
else
    echo "❌ Selección inválida."
    exit 1
fi
