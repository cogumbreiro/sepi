"use strict";

var HOST = "http://scribble.doc.ic.ac.uk:55001";
//var HOST = "http://localhost:55001";

function send(path, data, callback) {
    var result = document.getElementById("result");

    result.textContent = "Running...";
    var request = new XMLHttpRequest();
    request.open("POST", HOST + path, true);
    
    request.setRequestHeader("Content-Type", "application/json");
    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            var json;

            try {
                json = JSON.parse(request.response);
            } catch (e) {
                console.log("JSON.parse(): " + e);
            }

            if (request.status == 200) {
                callback(json);
            } else {
                result.textContent = "connection failure";
            }
        }
    }
    request.timeout = 10000;
    request.ontimeout = function() {
        result.textContent = "connection timed out"
    }
    request.send(JSON.stringify(data));
}

function simpleExec(result, path, data) {
    send(path, data,
         function(object) {
          result.textContent = object["result"];

          var div = document.createElement("div");
          div.className = "message";
          div.textContent = "Program ended.";
          result.appendChild(div);
    });
}

function getQueryParameters() {
    var a = window.location.search.substr(1).split('&');
    if (a == "") return {};
    var b = {};
    for (var i = 0; i < a.length; i++) {
        var p = a[i].split('=');
        if (p.length != 2) continue;
        b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
    }
    return b;
}

function setSample(sample, session, result, index) {
    sample.options[index].selected = true;
    if (sample.options[index].value == "") {
        // skip options without a value
        return;
    }
    var file = sample.options[index].value;
    var request = new XMLHttpRequest();
    request.open("GET", "sample/" + file, true);
    request.overrideMimeType("text/plain");
    request.onreadystatechange = function() {
        if (request.readyState == 4) {
            if (request.status == 0 || request.status == 200) {
                session.setValue(request.responseText.slice(0, -1));
            } else {
                result.textContent = "connection failure";
            }
        }
    };
    request.send();
}

var SAMPLES = ["Boolean Server.pi", "Hello World.pi",
    "Request and Response On Linear 1.pi",
    "Channel Forwarding.pi", "List Server.pi",
    "Request and Response On Linear 2.pi",
    "Donation.pi", "Movies.pi", "Request and Response On Polyadic.pi",
    "Everlasting.pi", "Mutual Recursion.pi",
    "Request and Response On Shared.pi",
    "Factorial in CPS.pi",
    "Print Server.pi", "The TCell.pi"];

function initSamples(session, samples) {
    if (samples.length == 0) {
        sample.remove(0); // remove the "loading" option
        var load_sample = document.createElement("option");
        load_sample.value = "";
        load_sample.text = "No samples to load";
        return;
    }
    // there are some samples to load
    var sample = document.getElementById("sample");
    sample.remove(0); // remove the "loading" option
    var load_sample = document.createElement("option");
    load_sample.value = "";
    load_sample.text = "Load a sample";
    sample.add(load_sample, null);
    load_sample = document.createElement("option");
    load_sample.value = "";
    load_sample.text = "";
    sample.add(load_sample, null);
    // populate with new ones
    for (var i = 0; i < samples.length; i++) {
        var file = samples[i];
        var opt = document.createElement("option");
        opt.value = file;
        // the displayed text omits the extension
        opt.text = file.substr(0, file.lastIndexOf('.')); 
        sample.add(opt, null);
    }
    // change the contents of the editor, when changing the 
    sample.onchange = function() {
        setSample(sample, session, result, sample.selectedIndex);
    };
}

/*
 * Sets up the interface, by connecting the function handlers above to the
 * controls of the interface.
 */
addEventListener("DOMContentLoaded", function() {
    var result = document.getElementById("result");
    /* Obtain the editor component */
    var editor = ace.edit("editor");
    var session = editor.getSession();
    /* Configure the editor's look and feel and the syntax it will highlight */
    editor.setTheme("ace/theme/github");
    session.setMode("ace/mode/rust");
    /* Get any parameters sent by submiting the form (aka the editor's
     * contents) */
    var query = getQueryParameters();
    if ("code" in query) {
        session.setValue(query["code"]);
    } else {
        var code = localStorage.getItem("code");
        if (code !== null) {
            session.setValue(code);
        }
    }
    /*
     * Store the code in the editor in the cache of the browser.
     */
    session.on("change", function() {
        localStorage.setItem("code", session.getValue());
    });
    /*
     * Connect the button 'scribble' to the handler 'simpleExec'
     */
    document.getElementById("run").onclick = function() {
        simpleExec(result, "/run.json", {code:session.getValue()});
    };
    /* Load the available samples */
    initSamples(session, SAMPLES);
}, false);
