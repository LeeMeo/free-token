#!/bin/bash
#
# free-token 模型切换脚本
# 用法: ./switch-model.sh <模型名称>
#       ./switch-model.sh list   # 列出可用模型
#
# 可用模型:
#   - minimax-m2.1-free    (MiniMax M2.1)
#   - big-pickle           (Big Pickle)
#   - gpt-5-nano           (GPT-5 Nano)
#   - glm-4.7-free         (GLM-4.7 Free)
#   - kimi-k2.5-free       (Kimi K2.5 Free)
#   - trinity-large-preview-free (Trinity Large Preview)
#

set -e

FREE_TOKEN_DIR="/home/admin/free-token"
FREE_TOKEN_LOG="/home/admin/free-token.log"
GATEWAY_PORT=3000

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

declare -A MODELS=(
    ["minimax-m2.1-free"]="MiniMax M2.1 Free"
    ["big-pickle"]="Big Pickle"
    ["gpt-5-nano"]="GPT-5 Nano"
    ["glm-4.7-free"]="GLM-4.7 Free"
    ["kimi-k2.5-free"]="Kimi K2.5 Free"
    ["trinity-large-preview-free"]="Trinity Large Preview"
)

list_models() {
    echo -e "${GREEN}可用模型列表:${NC}"
    echo "------------------------"
    for model in "${!MODELS[@]}"; do
        echo -e "  ${YELLOW}$model${NC} - ${MODELS[$model]}"
    done
    echo "------------------------"
}

get_current_model() {
    curl -s "http://localhost:${GATEWAY_PORT}/v1/models/default" 2>/dev/null | \
        python3 -c "import sys, json; d=json.load(sys.stdin); print(d.get('id', 'unknown'))" 2>/dev/null || \
        echo "unknown"
}

switch_model() {
    local new_model=$1

    if [[ -z "$new_model" ]]; then
        echo -e "${RED}错误: 请指定模型名称${NC}"
        echo "用法: $0 <模型名称>"
        echo "或: $0 list 查看可用模型"
        exit 1
    fi

    if [[ "$new_model" == "list" ]]; then
        list_models
        exit 0
    fi

    if [[ -z "${MODELS[$new_model]}" ]]; then
        echo -e "${RED}错误: 未知模型 '$new_model'${NC}"
        echo ""
        list_models
        exit 1
    fi

    local current_model=$(get_current_model)
    echo -e "${GREEN}切换模型${NC}"
    echo "------------------------"
    echo -e "当前模型: ${YELLOW}$current_model${NC}"
    echo -e "目标模型: ${YELLOW}$new_model${NC} (${MODELS[$new_model]})"
    echo "------------------------"

    # 通过 API 切换
    echo -e "${YELLOW}切换模型...${NC}"
    local result=$(curl -s -X POST "http://localhost:${GATEWAY_PORT}/v1/models/default" \
        -H "Content-Type: application/json" \
        -d "{\"model\": \"$new_model\"}" 2>/dev/null)

    if echo "$result" | grep -qE '"success".*true|"current"' || [[ "$result" == *"\"$new_model\""* ]]; then
        echo -e "${GREEN}✓ 模型切换成功${NC}"
    else
        echo -e "${RED}✗ 模型切换失败: $result${NC}"
        exit 1
    fi

    echo ""
    echo -e "${GREEN}模型切换完成${NC}"
    echo "------------------------"
    echo -e "当前模型: ${YELLOW}$(get_current_model)${NC}"
    echo "------------------------"
}

case "${1}" in
    "")
        echo -e "${RED}错误: 请指定模型名称${NC}"
        echo "用法: $0 <模型名称>"
        echo "或: $0 list 查看可用模型"
        exit 1
        ;;
    "list"|"-l"|"--list")
        list_models
        ;;
    *)
        switch_model "$1"
        ;;
esac
