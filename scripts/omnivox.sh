#!/bin/bash
# Omnivox MCP tool wrapper
# Usage: omnivox <tool-name> [json-params]
#        echo '{"key": "value"}' | omnivox <tool-name>
#        omnivox tools [name1,name2,...]
# Examples:
#   omnivox get-courses-summary
#   omnivox get-mio-messages
#   omnivox get-course-documents '{"course_id": "2434H5EM.1012"}'
#   echo '{"course_id": "2434H5EM.1012"}' | omnivox get-course-documents
#   omnivox tools   (list all available tools)
#   omnivox tools get-overview,get-calendar   (query specific tools by name)
#
# Tool discovery:
#   Use "omnivox tools" for all tools
#   Use "omnivox tools <name1,name2,...>" to filter by names
# Responses include tool names, descriptions, and input schemas.

SERVER="http://127.0.0.1:3000"
AUTH_HEADER="x-mcp-auth: $(cat ~/.omnivox/accessKey.txt 2>/dev/null)"

if [ -z "$1" ]; then
    echo "Usage: omnivox <tool-name> [json-params]"
    echo "       echo '{...}' | omnivox <tool-name>"
    echo "       omnivox tools [name1,name2,...]"
    exit 1
fi

if [ "$1" = "tools" ]; then
    if [ -n "$2" ]; then
        TOOLS_URL="$SERVER/tools?names=$2"
    else
        TOOLS_URL="$SERVER/tools"
    fi

    curl -s "$TOOLS_URL" -H "$AUTH_HEADER" | python3 -m json.tool 2>/dev/null || curl -s "$TOOLS_URL" -H "$AUTH_HEADER"
    exit 0
fi

TOOL="$1"

# Accept params from arg, stdin (if data available), or default to empty object
if [ -n "$2" ]; then
    PARAMS="$2"
elif [ ! -t 0 ] && read -t 1 -r _test_line 2>/dev/null; then
    # stdin has data (piped input) - read it all
    PARAMS="$_test_line$(cat)"
else
    PARAMS="{}"
fi

curl -s -X POST "$SERVER/tools/$TOOL" \
    -H "$AUTH_HEADER" \
    -H "Content-Type: application/json" \
    -d "$PARAMS"
