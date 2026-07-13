import supabase from "./supabase.js";

var cardImg;
var editID;
var currentUserEmail = null;
var currentUserName = null;
var currentUserId = null;
var postTime = new Date()
var timeOnly = postTime.toLocaleTimeString()
// const logout = document.getElementById("btn-logout")

async function userInfo() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) {
      Swal.fire({
        icon: "info",
        title: "Not logged in",
        text: "Please login to view your info.",
      });
      return
    }

    Swal.fire({
      title: `${user.user_metadata.first_name}'s Info`,
      html: `
        <div style="text-align:left">
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>User ID:</strong> ${user.id}</p>
          <p><strong>First Name:</strong> ${user.user_metadata.first_name}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Logout",
      cancelButtonText: "Close",
      confirmButtonColor: "#dc3545",
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
      }
    });

  } catch (error) {
    console.log(error);
  }
}
async function logout() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.log("Logout error:", error.message);
  } else {
    window.location.href = "index.html";
  }
}


async function searchPosts() {

  let searchValue = document.getElementById("searchValue").value.trim();

  var postsContainer = document.getElementById("posts");
  postsContainer.innerHTML = "";
  try {
    const { data, error } = await supabase
      .from('Post App Table')
      .select('*')
      // .ilike('title', `%${searchValue}%`)
      .or(`title.ilike.%${searchValue}%, description.ilike.%${searchValue}%, userName.ilike.%${searchValue}%, email.ilike.%${searchValue}%`)
    if (data.length === 0) {
      console.log("No posts found.");
      Swal.fire({
        icon: "info",
        title: "No results",
        text: "No posts found matching your search.",
      });
    }
    if (error) console.log(error);

    console.log(data);
  const { data: likes } = await supabase.from('Likes').select('*')
    const { data: comments } = await supabase.from('Comments').select('*').order('created_at', { ascending: false })

    renderPosts(data, likes || [], comments || [])
  }
  catch (error) {
    console.log(error);

  }

}


window.addEventListener('DOMContentLoaded', async () => {
  console.log("DOM Loaded");
  try {
    const { data: { user } } = await supabase.auth.getUser()
    currentUserId = user.id;
    currentUserEmail = user.email;
    currentUserName = user.user_metadata?.first_name || user.email.split('@')[0];
    var firstLetter = currentUserName.charAt(0).toUpperCase();
    document.getElementById("userInfo").textContent = firstLetter;
    console.log("Current User:", user);
    if (!user) {
      Swal.fire({
        icon: "error",
        title: "Not Logged In",
        text: "Please log in to post.",
      });
      return;
    }
  } catch (error) {
    console.log(error);
  }
  // Check if user is logged in via Supabase
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    // Not logged in — redirect back to login page
    window.location.href = "index.html";
    return;
  }

  var postBox = document.getElementById("postBox");
  if (postBox) postBox.classList.remove("d-none");



  var posts = []
  try {
    const { data, error } = await supabase
      .from('Post App Table')
      .select('*')
      .order('id', { ascending: false });

    console.log(data);
    posts = data;

    if (error) console.log(error);
  }
  catch (error) {
    console.log(error);
  }
  const { data: { likes } } = await supabase.from('Likes').select('*').order('created_at', { ascending: false });;
  const { data: { comments } } = await supabase.from('Comments').select('*').order('created_at', { ascending: false });
  renderPosts(posts, likes || [], comments || []);
})


// Function to render posts with likes and comments
async function renderPosts(posts, likes, comments) {
  var postsContainer = document.getElementById("posts");
  postsContainer.innerHTML = ""; // Clear existing posts
  posts.forEach(post => {
    var isOwner = post.user_id === currentUserId;
    var postLikes = likes.filter(like => like.post_id === post.id);
    var likesCount = postLikes.length;
    var isLiked = postLikes.some(like => like.user_id === currentUserId);
    var postComments = comments.filter(comment => comment.post_id === post.id);
    var commentsCount = postComments.length;
    var commentsHtml = postComments.map(c => `
      <div class="comment-item d-flex justify-content-between">
        <small><b>${c.email}:</b> ${c.comment_text}</small>
        ${c.user_id === currentUserId ? `<span onclick="deleteComment(event, ${c.id})" style="cursor:pointer" class="text-danger">✖</span>` : ''}
      </div>
    `).join('')


    postsContainer.innerHTML += `
    <div class="card mb-2" id="post-${post.id}">
      <div class="card-header">${post.id} : ${post.userName} </div>
      <div class="card-header f-2 text-secondary"> ${post.email} </div>
      <div style="background-image:url(${post.img_bg})" class="card-body">
        <figure>
          <blockquote class="blockquote">
            <p>${post.title}</p>
          </blockquote>
          <figcaption class="blockquote-footer">${post.description}</figcaption>
        </figure>
      </div>

      <div class="d-flex align-items-center gap-3 px-2">
        <span onclick="toggleLike(event, ${post.id})" style="cursor:pointer">
          ${isLiked ? '❤️' : '🤍'} <span id="like-count-${post.id}">${likesCount}</span>
        </span>
        <span onclick="toggleCommentsBox(${post.id})" style="cursor:pointer">
          💬 <span id="comment-count-${post.id}">${commentsCount}</span>
        </span>
      </div>  
      <div id="comments-box-${post.id}" style="display:none" class="p-2">
        <div id="comments-list-${post.id}">
          ${commentsHtml}
        </div>
        <div class="d-flex gap-1 mt-1">
          <input type="text" id="comment-input-${post.id}" class="form-control form-control-sm" placeholder="Add a comment...">
          <button onclick="addComment(event, ${post.id})" class="btn btn-sm btn-primary">Send</button>
        </div>
      </div>

      <div class="ms-auto m-2">
        ${isOwner ? `
          <button onclick="editPost(event,${post.id})" class="btn btn-success">Edit</button>
          <button onclick="deletePost(event,${post.id})" class="btn btn-danger">Delete</button>
        ` : ''}
      </div>
    </div>`
  })
}




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
      .from("Post App Table")
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
  var descText = overlay.querySelector("h6").innerText;

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
 let imageFile = document.getElementById('img_upload').files[0]
 console.log(imageFile);
 
  if (!title.trim() || !description.trim()) {
    Swal.fire({
      icon: "error",
      title: "Empty Post is not Allowed",
      text: "Enter the title and description",
    });
    return;
  }
  try {
    const { data: { user } } = await supabase.auth.getUser()


    currentUserEmail = user.email;
    currentUserId = user.id;
    if (!user) {
      Swal.fire({
        icon: "error",
        title: "Not Logged In",
        text: "Please log in to post.",
      });
      return;
    }
  } catch (error) {
    console.log(error);
  }
  let img_url = null;
  if (imageFile) {
    var imageName = `${Date.now()}_${imageFile.name}`
    const {error : uploadError} = await supabase
    .storage
    .from('post')
    .upload(imageName , imageFile , {
      cacheControl : '3600',
      upsert : false
    })
    if(uploadError){
      console.log(uploadError);
      alert('img upload failed')
      return
    }

    const{data : img_data } = supabase
    .storage
    .from('post')
    .getPublicUrl(imageName)
    img_url = img_data.publicUrl 
    console.log(img_url);
    

  }else if(cardImg){
    img_url = cardImg
  }else{
    alert('Please select an image')
  }
  try {
    let inserted;

    if (editID) {
      const { data, error } = await supabase
        .from("Post App Table")
        .update({ userName: currentUserName, title, description, img_bg: img_url, created_at: new Date().toISOString(), email: currentUserEmail })
        .eq('id', editID)
        .select("*");
      if (error) throw error;
      inserted = data[0];
      editID = null;
    } else {
      const { data, error } = await supabase
        .from("Post App Table")
        .insert([{ userName: currentUserName, title, description, img_bg: img_url, email: currentUserEmail, created_at: new Date().toISOString() }])
        .select("*");
      if (error) throw error;
      console.log(data[0]);
      inserted = data[0];
    }


    document.getElementById("title").value = "";
    document.getElementById("description").value = "";
    location.reload();


  } catch (error) {
    console.log(error);
    Swal.fire({
      icon: "error",
      title: "Something went wrong",
      text: error.message || "Could not save the post.",
    });
  }
}

function logOut() {
  location.href = "index.html";
}
 function toggleCommentsBox(postID) {
  const commentsBox = document.getElementById(`comments-box-${postID}`);
  commentsBox.style.display = commentsBox.style.display === 'none'? 'block' : 'none';
}

async function addComment(event, postID) {
  const commentInput = document.getElementById(`comment-input-${postID}`);
  const commentText = commentInput.value.trim();
  if(!currentUserId){
    Swal.fire({
      icon: "error",
      title: "Not Logged In",
      text: "Please log in to comment.",
    });
    return;
  } 
  if (!commentText) {
    Swal.fire({
      icon: "error",
      title: "Empty Comment",
      text: "Please enter a comment before sending.",
    });
    return;
  }
  try{

    const {data , error} = await supabase.from('Comments').insert([{post_id:postID,user_id:currentUserId,email:currentUserEmail,userName:currentUserName,comment_text:commentText}]).select('*')
    if(error) throw error;
    commentInput.value = '';
    const { data: posts } = await supabase.from('Post App Table').select('*').order('id', { ascending: false });
    const { data: likes } = await supabase.from('Likes').select('*').order('created_at', { ascending: false });
    const { data: comments } = await supabase.from('Comments').select('*').order('created_at', { ascending: false });
    renderPosts(posts || [], likes || [], comments || []);
  }catch(error){
    console.log(error);
  }
}

async function toggleLike(event,postID){
  if(!currentUserId){
    Swal.fire({
      icon: "error",
      title: "Not Logged In",
      text: "Please log in to like posts.",
    });
    return;
  }
  try {
    const {data:existingLike,error:likeError} = await supabase
    .from('Likes')
    .select('*')
    .eq('post_id',postID)
    .eq('user_id',currentUserId)
    .maybeSingle()
    if(likeError) throw likeError;
    if(existingLike){
      const {data:deletedData,error:deleteError} = await supabase
      .from('Likes').delete().eq('post_id',postID).eq('user_id',currentUserId)
      if(deleteError) throw deleteError;

    }else{
      const {data:insertedData , error:insertError} = await supabase
      .from('Likes').insert([{post_id:postID,user_id:currentUserId,email:currentUserEmail,userName:currentUserName}]).select('*')
      if(insertError) throw insertError;
    }
     const { data: posts } = await supabase.from('Post App Table').select('*').order('id', { ascending: false });
    const { data: likes } = await supabase.from('Likes').select('*').order('created_at', { ascending: false });
    const { data: comments } = await supabase.from('Comments').select('*').order('created_at', { ascending: false });
    renderPosts(posts || [], likes || [], comments || []);

  }catch (error) {
    console.log(error);
  }
}


function handleUploadPreview(event) {
    var label = document.getElementById('uploadLabel');
    var icon = document.getElementById('uploadIcon');
    var file = event.target.files[0];

    if (file) {
      label.classList.add('has-file');
      // swap to a checkmark once a file is chosen
      icon.innerHTML = '<path d="M20 6L9 17l-5-5"></path>';
      label.title = file.name;
    } else {
      label.classList.remove('has-file');
      icon.innerHTML = '<path d="M12 3v12"></path><path d="M7 8l5-5 5 5"></path><path d="M5 21h14"></path>';
      label.title = 'Upload your own image';
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
window.searchPosts = searchPosts;
window.logOut = logOut
window.toggleLike = toggleLike;
window.toggleCommentsBox = toggleCommentsBox;
window.addComment = addComment;
window.logout = logout;
window.userInfo = userInfo;
window.handleUploadPreview = handleUploadPreview