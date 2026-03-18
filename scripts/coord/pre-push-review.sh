#!/bin/sh
# Pre-push hook: run coord:review when pushing a codex/task-XXX branch.
# Install: cp scripts/coord/pre-push-review.sh .git/hooks/pre-push && chmod +x .git/hooks/pre-push

set -e
branch=$(git branch --show-current)
task_id=""
case "$branch" in
  codex/task-*)
    suffix="${branch#codex/task-}"
    num=$(echo "$suffix" | cut -d'-' -f1)
    task_id="t-$num"
    ;;
esac

if [ -n "$task_id" ]; then
  echo "coord:review for $task_id..."
  pnpm coord:review:run --taskId="$task_id"
  ret=$?
  [ $ret -eq 0 ] || exit $ret
fi
exit 0
