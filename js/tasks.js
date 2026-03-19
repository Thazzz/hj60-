/*
TASKS MODULE
*/

console.log("tasks.js geladen");

/* =============================
CONFIG
============================= */

const CURRENT_USER = "Thijs";


/* =============================
STATE
============================= */

let tasks = [];


/* =============================
TEST INSERT
============================= */

async function testInsertTask(){

    const { error } = await supabaseClient
        .from("tasks")
        .insert([{
            title: "Test klus vanuit JS",
            description: "debug insert",
            priority: 1,
            status: "todo",
            owner: CURRENT_USER
        }]);

    if(error){
        console.error("❌ insert fout:", error);
    } else {
        console.log("✅ insert gelukt");
    }

}


/* =============================
LOAD TASKS
============================= */

async function loadTasks(){

    const { data, error } = await supabaseClient
        .from("tasks")
        .select("*")
        .order("status", { ascending: true })
        .order("priority", { ascending: true });

    if(error){
        console.error("❌ load error", error);
        return;
    }

    tasks = data;

    console.log("📦 tasks:", tasks);

}


/* =============================
INIT
============================= */

async function initTasks(){

    await loadTasks();
    renderTaskListPlanner();
}

initTasks();


/* =============================
DEBUG
============================= */

// run in console:
// testInsertTask()
// loadTasks()