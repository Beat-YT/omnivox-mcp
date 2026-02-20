#!/bin/bash
# Omnivox MCP REST API wrapper
# Usage: omnivox <tool-name> [json-params]
#        echo '{"key": "value"}' | omnivox <tool-name>
# Examples:
#   omnivox get-courses-summary
#   omnivox get-mio-messages
#   omnivox get-course-documents '{"course_id": "2434H5EM.1012"}'
#   echo '{"course_id": "2434H5EM.1012"}' | omnivox get-course-documents
#   omnivox tools   (list all available tools)

SERVER="http://127.0.0.1:3000"
AUTH_HEADER="x-mcp-auth: $(cat ~/.omnivox/accessKey.txt 2>/dev/null)"

if [ -z "$1" ]; then
    echo "Usage: omnivox <tool-name> [json-params]"
    echo "       echo '{...}' | omnivox <tool-name>"
    echo "       omnivox tools"
    exit 1
fi

if [ "$1" = "tools" ]; then
    curl -s "$SERVER/tools" -H "$AUTH_HEADER" | python3 -m json.tool 2>/dev/null || curl -s "$SERVER/tools" -H "$AUTH_HEADER"
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
