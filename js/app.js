/*
HJ60 dashboard test script
controleert of JS werkt en vult testdata in
*/

console.log("HJ60 dashboard gestart");

/* -----------------------------
TEST DATA
----------------------------- */

const events = [

{
    title: "Tom naar Noorwegen",
    start: "2026-06-10",
    end: "2026-06-20",
    type: "trip",
    owner: "Tom"
},

{
    title: "Klusdag",
    start: "2026-04-12",
    type: "klus"
}

];

const tasks = [

"Olie verversen",
"Banden controleren",
"Remmen inspecteren"

];

const shopping = [

"Motorolie",
"Oliefilter",
"Remreiniger"

];


/* -----------------------------
STATUS BALK
----------------------------- */

function updateStatus(){

    const statusElement = document.getElementById("status");

    const now = new Date();

    const activeTrip = events.find(event => {

        if(!event.end) return false;

        const start = new Date(event.start);
        const end = new Date(event.end);

        return now >= start && now <= end;

    });

    if(activeTrip){

        statusElement.innerText =
        "🚙 Nu onderweg: " + activeTrip.owner;

    }

    else{

        statusElement.innerText =
        "🚙 HJ60 staat momenteel stil";

    }

}


/* -----------------------------
KLUSSENLIJST
----------------------------- */

function renderTasks(){

    const list = document.getElementById("taskList");

    list.innerHTML = "";

    tasks.forEach(task => {

        const li = document.createElement("li");

        li.textContent = task;

        list.appendChild(li);

    });

}


/* -----------------------------
BOODSCHAPPENLIJST
----------------------------- */

function renderShopping(){

    const list = document.getElementById("shoppingList");

    list.innerHTML = "";

    shopping.forEach(item => {

        const li = document.createElement("li");

        li.textContent = item;

        list.appendChild(li);

    });

}


/* -----------------------------
APP START
----------------------------- */

function startApp(){

    console.log("Dashboard initialiseren");

    updateStatus();

    renderTasks();

    renderShopping();

}

startApp();
