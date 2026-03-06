import supabase from "./supabase.js";

var cardImg;
var editID;

var postTime = new Date()
var timeOnly = postTime.toLocaleTimeString()
// const logout = document.getElementById("btn-logout")
async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.log("Logout error:", error.message);
  } else {
    window.location.href = "index.html";
  }
}


async function searchPosts() {

  let searchValue = document.getElementById("searchValue").value;
  
   var posts = document.getElementById("posts");
   posts.innerHTML = "";
   try {
    
   } catch (error) {
    
   }
}




window.addEventListener('DOMContentLoaded', async () => {
  console.log("DOM Loaded");

  // Check if user is logged in via Supabase
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Not logged in — redirect back to login page
    window.location.href = "index.html";
    return;
  }

  // User is authenticated — show the post box
  var postBox = document.getElementById("postBox");
  if (postBox) postBox.classList.remove("d-none");

  // Auto-fill userName from the logged-in user's Supabase metadata
  var userNameInput = document.getElementById("userName");
  if (userNameInput && session.user.user_metadata?.userName) {
    userNameInput.value = session.user.user_metadata.userName;
  } else if (userNameInput) {
    // Fallback: use email prefix if no username metadata
    userNameInput.value = session.user.email.split("@")[0];
  }
})
  // Load posts from database
  async function loadPost() {
    try {
      const { data, error } = await supabase
        .from('postApp')
        .select('*')
        .order('id', { ascending: false });
  
      console.log(data);
      var posts = document.getElementById("posts");
      posts.innerHTML = ""
      data.forEach(post => {
        posts.innerHTML += `   <div   class="col-lg-8 col-md-12 col-sm-12">
          <div style="background: url('${post.img_url}');" class="card text-bg-light postCard">
          
            <div class="card-img-overlay">
                        <h3 class="card-title text-white my-4">${post.username}</h3>
              <h5 class="card-title text-white">${post.title}</h5>
              <p class="card-text text-white">${post.description}</p>
              <p class="card-text text-white"><small>${post.created_at}</small></p>
              <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                <button onclick = " editPost(event,${post.id})" class="btn btn-success me-md-2" type="button">Edit</button>
                <button  onclick = "deletePost(event,${post.id})" class="btn btn-danger" type="button">Delete</button>
              </div>
            </div>
          </div>
        </div>`;
        document.getElementById("title").value = "";
        document.getElementById("description").value = "";
  
      })
      if (error) console.log(error);
    }
    catch (error) {
      console.log(error);
    }
  }


window.addEventListener('DOMContentLoaded',loadPost())
async function deletePost(event, id) {
  try {

    const swalWithBootstrapButtons = Swal.mixin({
      customClass: {
        confirmButton: "btn btn-success",
        cancelButton: "btn btn-danger"
      },
      buttonsStyling: false
    });

    const result = await swalWithBootstrapButtons.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!",
      reverseButtons: true
    });

    // Agar cancel kare to function yahin stop
    if (!result.isConfirmed) {
      Swal.fire("Cancelled", "Your post is safe :)", "error");
      return;
    }

    // Database delete
    const { error } = await supabase
      .from("postApp")
      .delete()
      .eq("id", id);

    if (error) {
      console.log("Delete Error:", error);
      Swal.fire("Error!", "There was an error deleting your post.", "error");
      return;
    }

    // UI remove only after DB success
    event.target.closest(".col-lg-8").remove();

    Swal.fire("Deleted!", "Your post has been deleted.", "success");

  } catch (error) {
    console.log(error);
  }
}


function editPost(event, id) {
  // Get the top-level col div to remove it
  var cardCol = event.target.closest(".col-lg-8");

  // Use querySelector to reliably find title (h5) and description (p)
  var overlay = cardCol.querySelector(".card-img-overlay");
  var titleText = overlay.querySelector("h5").innerText;
  var descText = overlay.querySelector("p").innerText;

  document.getElementById("title").value = titleText;
  document.getElementById("description").value = descText;
  cardCol.remove();
  editID = id;
}

async function post() {
  var userName = document.getElementById("userName").value;
  var title = document.getElementById("title").value;
  var description = document.getElementById("description").value;
  var posts = document.getElementById("posts");
  console.log(title, description);

  if (!title.trim() || !description.trim()) {
    Swal.fire({
      icon: "error",
      title: "Empty Post is not Allowed",
      text: "Enter the title and description",
    });
    return;
  }

  try {
    let inserted;

    if (editID) {
      const { data, error } = await supabase
        .from("postApp")
        .update({ username: userName, title, description, img_url: cardImg })
        .eq('id', editID)
        .select("*");
      if (error) throw error;
      inserted = data[0];
      editID = null;
    } else {
      const { data, error } = await supabase
        .from("postApp")
        .insert([{ username: userName, title, description, img_url: cardImg }])
        .select("*");
      if (error) throw error;
      console.log(data[0]);
      inserted = data[0];
    }

    // Only render card after DB operation succeeds and inserted is defined
    document.getElementById("title").value = "";
    document.getElementById("description").value = "";

    posts.innerHTML += `<div class="col-lg-8 col-md-12 col-sm-12">
        <div style="background: url('${inserted.img_url}');" class="card text-bg-light postCard">
          <div class="card-img-overlay">
            <h3 class="card-title text-white my-4">${inserted.username}</h3>
            <h5 class="card-title text-white">${inserted.title}</h5>
            <p class="card-text text-white">${inserted.description}</p>
            <p class="card-text text-white"><small>${inserted.created_at}</small></p>
            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
              <button onclick="editPost(event, ${inserted.id})" class="btn btn-success me-md-2" type="button">Edit</button>
              <button onclick="deletePost(event, ${inserted.id})" class="btn btn-danger" type="button">Delete</button>
            </div>
          </div>
        </div>
      </div>`;

  } catch (error) {
    console.log(error);
    Swal.fire({
      icon: "error",
      title: "Something went wrong",
      text: error.message || "Could not save the post.",
    });
  }
}




function clickAbleImg(src) {
  var bgImg = document.getElementsByClassName("bgImg");
  // console.log(bgImg);

  for (let i = 0; i < bgImg.length; i++) {
    bgImg[i].classList.remove("selectedImg");
  }
  console.log(event.target);
  event.target.classList.add("selectedImg");
  cardImg = event.target.src
}
window.post = post;
window.clickAbleImg = clickAbleImg;
window.deletePost = deletePost;
window.editPost = editPost;
window.loadPost = loadPost;
window.logout = logout;
const channel = supabase
  .channel('post-channel')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'postApp'
    },
    (payload) => {
      console.log(payload)
      loadPost()
    }
  )
  .subscribe()