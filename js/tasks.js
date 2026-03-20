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

window.tasks = [];
window.editingTaskId = null;

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
          owner: CURRENT_USER,
          shopping: "test boodschap"
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

/*================================
save task
=============================*/
window.saveTask = async function(){

    const title = document.getElementById("taskTitle").value.trim();
    const description = document.getElementById("taskDesc").value.trim();
    const priority = parseInt(document.getElementById("taskPriority").value);
    const owner = document.getElementById("taskOwner").value.trim();
    const shopping = document.getElementById("taskShopping").value.trim() || null;
    if(!title){
        alert("Titel verplicht");
        return;
    }

    let query;

if(editingTaskId){
    // 🔥 UPDATE (bestaande klus)
    query = supabaseClient
        .from("tasks")
        .update({
            title,
            description,
            priority,
            owner,
            shopping
        })
        .eq("id", editingTaskId);

} else {
    // 🆕 NIEUWE klus
    query = supabaseClient
        .from("tasks")
        .insert([{
            title,
            description,
            priority,
            status: "todo",
            owner,
            shopping
        }]);
}

const { error } = await query;

    if(error){
        console.error("❌ save error", error);
        alert("Opslaan mislukt");
        return;
    }

    console.log("✅ taak opgeslagen");

// reset edit mode
editingTaskId = null;
document.getElementById("deleteTaskBtn").style.display = "none";

    // reset form
    document.getElementById("taskTitle").value = "";
    document.getElementById("taskDesc").value = "";
    document.getElementById("taskPriority").value = "1";
    document.getElementById("taskOwner").value = "";
    document.getElementById("taskShopping").value = "";
    // refresh lijst
    await loadTasks();
    renderTaskListPlanner();
}
/*============================
delete task
========================*/
window.deleteTask = async function(){

    console.log("DELETE CLICK", window.editingTaskId);

    if(!window.editingTaskId){
        alert("Geen klus geselecteerd");
        return;
    }

    if(!confirm("Weet je zeker dat je deze klus wilt verwijderen?")){
        return;
    }

    const { error } = await supabaseClient
        .from("tasks")
        .delete()
        .eq("id", window.editingTaskId);

    if(error){
        console.error("❌ delete error", error);
        alert("Verwijderen mislukt");
        return;
    }

    console.log("🗑️ verwijderd");

    // reset
    window.editingTaskId = null;
    document.getElementById("deleteTaskBtn").style.display = "none";

    // refresh
    await loadTasks();
    renderTaskListPlanner();
}




/* =============================
INIT
============================= */

async function initTasks(){

    await loadTasks();
    renderTaskListPlanner();
}


window.addEventListener("DOMContentLoaded", () => {

    if(document.getElementById("taskListPlanner")){
        initTasks();
    }

    const btn = document.getElementById("deleteTaskBtn");

    if(btn){
        btn.onclick = deleteTask;
    }

});

/* =============================
DEBUG
============================= */

// run in console:
// testInsertTask()
// loadTasks()

