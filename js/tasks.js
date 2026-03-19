console.log("tasks.js geladen");

/* =============================
TEST: USER CHECK
============================= */

async function checkUser(){

    const { data, error } = await supabase.auth.getUser();

    if(error){
        console.error("❌ user error", error);
        return;
    }

    console.log("👤 ingelogde user:", data.user);

}

checkUser();