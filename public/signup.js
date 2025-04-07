document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("signup")

    form.addEventListener("submit", handleSubmit)
})

async function handleSubmit(e) {
    e.preventDefault()
    const fname = document.getElementById("first-name").value
    const lname = document.getElementById("last-name").value
    const email = document.getElementById("email").value
    const pn = document.getElementById("phone-number").value
    const dob = document.getElementById("dob").value
    const nationality = document.getElementById("nationality").value
    const password = document.getElementById("password").value
    const cpassword = document.getElementById("confirm-password").value

    console.log("First Name:", fname)
    console.log("Last Name:", lname)
    console.log("Email:", email)
    console.log("Phone Number:", pn)
    console.log("Date of Birth:", dob)
    console.log("Nationality:", nationality)
    console.log("Password:", password)
    console.log("Confirm Password:", cpassword)

    const newUser = {
        email: email,
        password: password, 
    }

try {
    const response = await fetch("https://safehaven-app-backend-jlg6.onrender.com/users/sign-up", {
        method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(newUser)
    })

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
    }

    const data = await response.json()
    console.log("Success:", data)

    e.target.reset()
} catch (error) {
    console.error("Error:", error)
    alert("Failed to create user!")
    }
}