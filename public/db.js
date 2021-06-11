const mongoose = require('mongoose');
const indexedDB =
window.indexedDB ||
window.mozIndexedDB ||
window.webkitIndexedDB ||
window.msIndexedDB ||
window.shimIndexedDB;

const url = `mongodb+srv://acombs801:<Dutton@10>@fitnesstracker.ryjbj.mongodb.net/budget?retryWrites=true&w=majority`;

const connectionParams={
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true 
}
mongoose.connect(url,connectionParams)
    .then( () => {
        console.log('Connected to database ')
    })
    .catch( (err) => {
        console.error(`Error connecting to the database. \n${err}`);
    })

let db;
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = ({ target }) => {
let db = target.result;
db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = ({ target }) => {
db = target.result;

// check if app is online before reading from db
if (navigator.onLine) {
  checkDatabase();
}
};

request.onerror = function(event) {
console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
const transaction = db.transaction(["pending"], "readwrite");
const store = transaction.objectStore("pending");

store.add(record);
}

function checkDatabase() {
const transaction = db.transaction(["pending"], "readwrite");
const store = transaction.objectStore("pending");
const getAll = store.getAll();

getAll.onsuccess = function() {
  if (getAll.result.length > 0) {
    fetch("/api/transaction/bulk", {
      method: "POST",
      body: JSON.stringify(getAll.result),
      headers: {
        Accept: "application/json, text/plain, */*",
        "Content-Type": "application/json"
      }
    })
    .then(response => {        
      return response.json();
    })
    .then(() => {
      // delete records if successful
      const transaction = db.transaction(["pending"], "readwrite");
      const store = transaction.objectStore("pending");
      store.clear();
    });
  }
};
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);