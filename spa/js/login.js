
/* login.js */

import { createToken, customiseNavbar, secureGet, loadPage, showMessage } from '../util.js'

export async function setup(node) {
	try {
		console.log('LOGIN: setup')
		console.log(node)
		document.querySelector('header p').innerText = 'Login Page'
		customiseNavbar(['login', 'register'])
		node.querySelector('form').addEventListener('submit', await login)
	} catch(err) {
		console.error(err)
	}
}

async function login() {
	event.preventDefault()
	console.log('form submitted')
	const formData = new FormData(event.target)
	const data = Object.fromEntries(formData.entries())
	const token = 'Basic ' + btoa(`${data.user}:${data.pass}`)
	const url = '/api/accounts'
	const options = {
		method: 'GET',
		headers: {
			'Authorization': token,
			'Content-Type': 'application/vnd.api+json',
			'Accept': 'application/vnd.api+json'
		}
	}
	const response = await fetch(url, options)
	const json = await response.json()
	if(response.status === 200) {
		localStorage.setItem('username', json.username)
		localStorage.setItem('role', json.role)
		localStorage.setItem('authorization', token)
		console.log(`you are logged in as ${JSON.stringify(json.username)}`)
		if(json.role === 1) {
			loadPage('manager')
		} else {
			loadPage('home')
		}
	} else {
		document.querySelector('input[name="pass"]').value = ''
		showMessage(json.errors[0].detail)
		}
}