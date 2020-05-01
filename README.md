To test a STUN/TURN server:
1. `git clone git@github.com:caseykey/turn-tester.git`
2. `cd turn-tester`
3. `cd utils/cred-gen && npm install && node . AUTH-CODE`
4. Edit the servers passed into `start()` on line 231 of /js/main.js 
5. Open turn-tester/index.html in Firefox
6. View console for output
