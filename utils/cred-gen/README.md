To test a STUN/TURN server:
1. `git clone git@github.com:caseykey/turn-tester.git`
2. `cd turn-tester`
3. `cd utils/cred-gen && npm install && node .`
4. Open turn-tester/index.html in Firefox
5. (optional) add a server
6. Click Gather candidates

Bugs:
Currently, the passcode may not be loaded, you can attempt fixing by adding a TURN server without  a password, then double click the entry to see if the passcode input gets populated.
