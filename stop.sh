

echo "> node"
if [ -f "node.pid" ]
then
    PID=$(cat node.pid)
    kill ${PID}
    rm -f node.pid
else
    echo "Couldn't find PID associated with node process."
    echo "Please kill the service manually."
fi
echo "Done."



