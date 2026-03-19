/*
TASKS MODULE
*/

console.log("tasks.js geladen");

/* =============================
STATE
============================= */

let tasks = [];


/* =============================
USER CHECK
============================= */

async function checkUser(){

    const { data, error } = await supabaseClient.auth.getUser();

    if(error){
        console.error("❌ user error", error);
        return;
    }

    if(!data.user){
        console.warn("⚠️ geen ingelogde user");
        return;
    }

    console.log("👤 ingelogde user:", data.user);

}


/* =============================
TEST INSERT
============================= */

async function testInsertTask(){

    const { data: userData } = await supabaseClient.auth.getUser();

    const user = userData.user;

    if(!user){
        console.error("❌ geen user");
        return;
    }

    const { error } = await supabaseClient
        .from("tasks")
        .insert([{
            title: "Test klus vanuit JS",
            description: "debug insert",
            priority: 1,
            status: "todo",
            owner: user.id
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

    await checkUser();
    await loadTasks();

}

initTasks();


/* =============================
DEBUG (handmatig gebruiken)
============================= */

// run in console:
// testInsertTask()
// loadTasks()