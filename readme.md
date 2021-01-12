This project is a user-interface layer for InVEST (Integrated Valuation of
Ecosystem Services and Tradeoffs).
InVEST can be found at https://github.com/natcap/invest.

The purpose of this project is to provide a single entry-point for all
InVEST models, and to be extensible to future models or common auxilary
workflows of an InVEST user.

## To develop and launch this Application

* `npm install`  
* bind to an `invest` executeable (see package.json "invest" for a compatible version)

In production, the invest exe comes from prebuilt binaries that are an artifact of the `invest` build process.  

For development, choose either:  
  **A.** Duplicate the production setup by fetching prebuilt binaries `npm run fetch-invest`  
  **B.** Use any other locally installed, compatible, invest CLI (e.g. from a local python environment). To configure this, see `.env-example`

* `npm start`

## To package this app for distribution  

`npm run build`  - calls babel to transpile ES6 and jsx code to commonjs; moves other resources (CSS, JSON) to the build directory

`npm run dist`  - packages build source into an electron application using electron-builder


### To run various scripts and local programs
See the "scripts" section of `package.json` and run them like:  
`npm run lint`  
`npm run test`  

To run other scripts or CLIs of locally installed packages, 
prefix commands with `npx` (e.g. `npx eslint ...`). Otherwise, only
globally installed packages are on the PATH. 

#### E.g. run a single test file:
`npx jest --coverage=false --verbose app.test.js`  

To run javascript outside the electron runtime, but with the same ECMAscript features and babel configurations, use `node -r @babel/register script.js`.  

