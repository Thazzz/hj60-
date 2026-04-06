/*
TASKS MODULE
*/

console.log("tasks.js geladen");

/* =============================
CONFIG
============================= */

const CURRENT_USER = "Thijs";
const TASK_PHOTO_BUCKET = "task-photos";
const MAX_TASK_PHOTO_SIZE = 5 * 1024 * 1024;

/* =============================
STATE
============================= */

window.tasks = [];
window.editingTaskId = null;
window.editingTaskPhotoPath = null;
window.taskPhotoFile = null;
window.removeTaskPhoto = false;

let taskPhotoPreviewObjectUrl = null;

/* =============================
DOM HELPERS
============================= */

function getTaskPhotoInput(){
    return document.getElementById("taskPhoto");
}

function getTaskPhotoPanel(){
    return document.getElementById("taskPhotoPanel");
}

function getTaskPhotoPreview(){
    return document.getElementById("taskPhotoPreview");
}

function getRemoveTaskPhotoButton(){
    return document.getElementById("removeTaskPhotoBtn");
}

function revokeTaskPhotoPreviewUrl(){
    if(taskPhotoPreviewObjectUrl){
        URL.revokeObjectURL(taskPhotoPreviewObjectUrl);
        taskPhotoPreviewObjectUrl = null;
    }
}

function getTaskPhotoPublicUrl(path){
    if(!path) return "";

    const { data } = supabaseClient
        .storage
        .from(TASK_PHOTO_BUCKET)
        .getPublicUrl(path);

    return data?.publicUrl || "";
}

function showTaskPhotoPreview(src){
    const panel = getTaskPhotoPanel();
    const preview = getTaskPhotoPreview();
    const removeButton = getRemoveTaskPhotoButton();

    if(!panel || !preview || !removeButton) return;

    panel.style.display = src ? "block" : "none";
    preview.src = src || "";
    removeButton.style.display = src ? "block" : "none";
}

function setTaskPhotoPreviewFromFile(file){
    revokeTaskPhotoPreviewUrl();
    taskPhotoPreviewObjectUrl = URL.createObjectURL(file);
    showTaskPhotoPreview(taskPhotoPreviewObjectUrl);
}

function setTaskPhotoPreviewFromPath(path){
    revokeTaskPhotoPreviewUrl();
    showTaskPhotoPreview(getTaskPhotoPublicUrl(path));
}

window.resetTaskPhotoUi = function(){
    revokeTaskPhotoPreviewUrl();

    window.editingTaskPhotoPath = null;
    window.taskPhotoFile = null;
    window.removeTaskPhoto = false;

    const input = getTaskPhotoInput();
    if(input){
        input.value = "";
    }

    showTaskPhotoPreview("");
};

window.setTaskPhotoStateFromTask = function(task){
    window.taskPhotoFile = null;
    window.removeTaskPhoto = false;
    window.editingTaskPhotoPath = task?.photo_path || null;

    const input = getTaskPhotoInput();
    if(input){
        input.value = "";
    }

    if(window.editingTaskPhotoPath){
        setTaskPhotoPreviewFromPath(window.editingTaskPhotoPath);
        return;
    }

    showTaskPhotoPreview("");
};

function resetTaskForm(){
    window.editingTaskId = null;
    document.getElementById("deleteTaskBtn").style.display = "none";
    document.getElementById("completeTaskBtn").style.display = "none";

    document.getElementById("taskTitle").value = "";
    document.getElementById("taskDesc").value = "";
    document.getElementById("taskPriority").value = "1";
    document.getElementById("taskOwner").value = "";
    document.getElementById("taskShopping").value = "";

    window.resetTaskPhotoUi();
}

/* =============================
PHOTO HELPERS
============================= */

function sanitizeFileName(name){
    return name.replace(/[^a-zA-Z0-9._-]/g, "-");
}

async function uploadTaskPhoto(taskId, file){
    const fileExt = file.name.includes(".")
        ? file.name.split(".").pop()
        : "jpg";
    const safeName = sanitizeFileName(file.name);
    const filePath = `tasks/${taskId}/${Date.now()}-${safeName || `photo.${fileExt}`}`;

    const { error } = await supabaseClient
        .storage
        .from(TASK_PHOTO_BUCKET)
        .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false
        });

    if(error){
        throw error;
    }

    return filePath;
}

async function deleteTaskPhotoFromStorage(path){
    if(!path) return;

    const { error } = await supabaseClient
        .storage
        .from(TASK_PHOTO_BUCKET)
        .remove([path]);

    if(error){
        throw error;
    }
}

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

/* =============================
PHOTO EVENTS
============================= */

function setupTaskPhotoField(){
    const input = getTaskPhotoInput();
    const removeButton = getRemoveTaskPhotoButton();

    if(input){
        input.addEventListener("change", () => {
            const file = input.files?.[0];

            if(!file){
                if(window.editingTaskPhotoPath && !window.removeTaskPhoto){
                    setTaskPhotoPreviewFromPath(window.editingTaskPhotoPath);
                } else {
                    showTaskPhotoPreview("");
                }
                window.taskPhotoFile = null;
                return;
            }

            if(!file.type.startsWith("image/")){
                alert("Kies een afbeeldingsbestand");
                input.value = "";
                return;
            }

            if(file.size > MAX_TASK_PHOTO_SIZE){
                alert("Foto is te groot. Maximaal 5 MB.");
                input.value = "";
                return;
            }

            window.taskPhotoFile = file;
            window.removeTaskPhoto = false;
            setTaskPhotoPreviewFromFile(file);
        });
    }

    if(removeButton){
        removeButton.addEventListener("click", () => {
            const inputField = getTaskPhotoInput();
            if(inputField){
                inputField.value = "";
            }

            window.taskPhotoFile = null;

            if(window.editingTaskPhotoPath){
                window.removeTaskPhoto = true;
            }

            showTaskPhotoPreview("");
        });
    }
}

function attachTaskPhotoPreviewToTaskEditor(){
    if(typeof loadTaskIntoForm !== "function"){
        return;
    }

    const originalLoadTaskIntoForm = loadTaskIntoForm;

    loadTaskIntoForm = function(task){
        originalLoadTaskIntoForm(task);
        window.setTaskPhotoStateFromTask(task);
    };
}

/* =============================
SAVE TASK
============================= */

window.saveTask = async function(){

    const title = document.getElementById("taskTitle").value.trim();
    const description = document.getElementById("taskDesc").value.trim();
    const priority = parseInt(document.getElementById("taskPriority").value, 10);
    const owner = document.getElementById("taskOwner").value.trim();
    const shopping = document.getElementById("taskShopping").value.trim() || null;

    if(!title){
        alert("Titel verplicht");
        return;
    }

    const payload = {
        title,
        description,
        priority,
        owner,
        shopping
    };

    let savedTask = null;

    if(editingTaskId){
        const { data, error } = await supabaseClient
            .from("tasks")
            .update(payload)
            .eq("id", editingTaskId)
            .select("id, photo_path")
            .single();

        if(error){
            console.error("❌ save error", error);
            alert("Opslaan mislukt");
            return;
        }

        savedTask = data;
    } else {
        const { data, error } = await supabaseClient
            .from("tasks")
            .insert([{
                ...payload,
                status: "todo"
            }])
            .select("id, photo_path")
            .single();

        if(error){
            console.error("❌ save error", error);
            alert("Opslaan mislukt");
            return;
        }

        savedTask = data;
    }

    const taskId = savedTask.id;
    const previousPhotoPath = window.editingTaskPhotoPath || savedTask.photo_path || null;

    try {
        if(window.taskPhotoFile){
            const uploadedPhotoPath = await uploadTaskPhoto(taskId, window.taskPhotoFile);

            const { error: updatePhotoError } = await supabaseClient
                .from("tasks")
                .update({ photo_path: uploadedPhotoPath })
                .eq("id", taskId);

            if(updatePhotoError){
                throw updatePhotoError;
            }

            if(previousPhotoPath && previousPhotoPath !== uploadedPhotoPath){
                await deleteTaskPhotoFromStorage(previousPhotoPath);
            }
        } else if(window.removeTaskPhoto && previousPhotoPath){
            const { error: clearPhotoError } = await supabaseClient
                .from("tasks")
                .update({ photo_path: null })
                .eq("id", taskId);

            if(clearPhotoError){
                throw clearPhotoError;
            }

            await deleteTaskPhotoFromStorage(previousPhotoPath);
        }
    } catch (error){
        console.error("❌ foto verwerken mislukt", error);
        alert("Taak opgeslagen, maar foto verwerken mislukt");
        await loadTasks();
        renderTaskListPlanner();
        return;
    }

    console.log("✅ taak opgeslagen");

    resetTaskForm();
    await loadTasks();
    renderTaskListPlanner();
};

/* =============================
DELETE TASK
============================= */

window.deleteTask = async function(){

    console.log("DELETE CLICK", window.editingTaskId);

    if(!window.editingTaskId){
        alert("Geen klus geselecteerd");
        return;
    }

    const taskToDelete = tasks.find(task => task.id === window.editingTaskId);

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

    try {
        if(taskToDelete?.photo_path){
            await deleteTaskPhotoFromStorage(taskToDelete.photo_path);
        }
    } catch (storageError){
        console.error("❌ foto verwijderen mislukt", storageError);
        alert("Klus verwijderd, maar de foto staat nog in storage");
    }

    resetTaskForm();
    await loadTasks();
    renderTaskListPlanner();
};

window.completeTask = async function(){

    if(!window.editingTaskId){
        alert("Geen klus geselecteerd");
        return;
    }

    if(!confirm("Klus afhandelen?")){
        return;
    }

    const { error } = await supabaseClient
        .from("tasks")
        .update({ status: "done" })
        .eq("id", window.editingTaskId);

    if(error){
        console.error("❌ afhandelen mislukt", error);
        alert("Afhandelen mislukt");
        return;
    }

    console.log("✅ klus afgehandeld");

    resetTaskForm();
    await loadTasks();
    renderTaskListPlanner();
};

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

    setupTaskPhotoField();
    attachTaskPhotoPreviewToTaskEditor();

    const btn = document.getElementById("deleteTaskBtn");
    const completeBtn = document.getElementById("completeTaskBtn");

    if(btn){
        btn.onclick = deleteTask;
    }

    if(completeBtn){
        completeBtn.onclick = completeTask;
    }
});

/* =============================
DEBUG
============================= */

// run in console:
// testInsertTask()
// loadTasks()
