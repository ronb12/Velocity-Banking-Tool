#!/bin/bash
# Usage: ./deploy-all.sh "Your commit message here"

git add .
git commit -m "${1:-Auto-commit before deploy}"
git push
firebase deploy --only hosting 