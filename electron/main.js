const {
    app,
    BrowserWindow
} = require("electron");

const path = require("path");
const { spawn } = require("child_process");

let backend;


function createWindow() {

    const win = new BrowserWindow({
        width: 1200,
        height: 800
    });


    if(process.env.NODE_ENV === "development") {

        win.loadURL(
            "http://localhost:5173"
        );

    } else {

        win.loadFile(
            path.join(
                __dirname,
                "../frontend/dist/index.html"
            )
        );

    }

}



app.whenReady().then(()=>{


    backend = spawn(
        "node",
        [
            path.join(
                __dirname,
                "../backend/server.js"
            )
        ]
    );


    setTimeout(()=>{

        createWindow();

    },2000);


});



app.on(
"window-all-closed",
()=>{


    if(backend)
        backend.kill();


    app.quit();

});