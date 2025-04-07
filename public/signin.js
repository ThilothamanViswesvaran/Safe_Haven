document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("signin")

    form.addEventListener("submit", handleSubmit)
})

async function handleSubmit(e) {
    e.preventDefault()
    const email = document.getElementById("email").value
    const password = document.getElementById("password").value

    console.log("Email:", email)
    console.log("Password:", password)

    const user = {
        email: email,
        password: password
    }

try {
    const response = await fetch("https://safehaven-app-backend-jlg6.onrender.com/users/login", {
        method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(user)
    })

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()
    console.log("Success:", data)

    e.target.reset()
} catch (error) {
    console.error("Error:", error)
    alert("Failed to Login!")
    }
}

