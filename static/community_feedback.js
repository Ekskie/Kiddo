function addFeedback() {
    let name = document.getElementById("userName").value.trim();
    let feedback = document.getElementById("userFeedback").value.trim();

    if (name === "" || feedback === "") {
        alert("Please enter your name and feedback before posting!");
        return;
    }

    fetch("/submit-feedback", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, feedback })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success") {
            let feed = document.getElementById("feedbackFeed");
            let newPost = document.createElement("div");
            newPost.classList.add("post");
            newPost.innerHTML = `
                <div class="post-header">${name}</div>
                <div class="post-content">${feedback}</div>
            `;
            feed.prepend(newPost);
            document.getElementById("userName").value = "";
            document.getElementById("userFeedback").value = "";
        } else {
            alert("Failed to submit feedback!");
        }
    })
    .catch(error => console.error("Error:", error));
}
