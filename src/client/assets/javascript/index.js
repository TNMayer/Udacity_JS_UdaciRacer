// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
let store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	try {
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks)
				renderAt('#tracks', html)
			})

		getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers)
				renderAt('#racers', html)
			})
	} catch(error) {
		console.log("There was a problem getting tracks and racers ::", error.message)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		let { target } = event;

		// Race track form field
		if (target.matches('.card.track') || target.parentNode.matches('.card.track')) {
			if (target.parentNode.matches('.card.track')) {
				target = target.parentNode;
			}

			if(!target.classList.contains('selected')) {
				handleSelectTrack(target);
			}
		}

		// Podracer form field
		if (target.matches('.card.podracer') || target.parentNode.matches('.card.podracer') || target.parentNode.parentNode.matches('.card.podracer')) {
			if (target.parentNode.matches('.card.podracer')) {
				target = target.parentNode;
			}
			if (target.parentNode.parentNode.matches('.card.podracer')) {
				target = target.parentNode.parentNode;
			}

			if(!target.classList.contains('selected')) {
				handleSelectPodRacer(target);
			}
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()
	
			// start race
			handleCreateRace();
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(target)
		}

	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log("an error shouldn't be possible here");
		console.log(error);
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	// Get player_id and track_id from the store
	const player_id = store.player_id;
	const track_id = store.track_id;

	if (!player_id || !track_id) {
		alert("Please choose your player and your track");
	}
	
	try {
		// render starting UI
		renderAt('#race', renderRaceStartView(track_id))

		// invoke the API call to create the race, then save the result
		const race = await createRace(player_id, track_id);
		
		// update the store with the race id
		store.race_id = race.ID-1;

		// The race has been created, now start the countdown
		// call the async function runCountdown
		await runCountdown();

		// call the async function startRace
		await startRace(store.race_id);

		// call the async function runRace
		await runRace(store.race_id);
	} catch (error) {
		console.log("There has been an error during race creation: " + error.message);
	}
}

function runRace(raceID) {
	return new Promise(resolve => {
		// setInterval method to get race info every 500ms
		const raceInterval = setInterval(async () => {
			try {
				const race = await getRace(store.race_id);
				if (race.status === "in-progress") {
					console.log("=== Race is still running ===");
					renderAt('#leaderBoard', raceProgress(race.positions));
				} else if (race.status === "finished") {
					console.log("=== Race finished ===");
					clearInterval(raceInterval);
					renderAt('#race', resultsView(race.positions));
					resolve(race);
				}
			} catch(error) {
				console.log("There was an error while race handling: " + error);
			}
		}, 500);
	})
	.catch((error) => {
		console.log("There was an error while running the race: " + error);
	})
	// remember to add error handling for the Promise
}

async function runCountdown() {
	try {
		// wait for the DOM to load
		await delay(500)
		let timer = 3

		return new Promise(resolve => {
			// setInterval method to count down once per second
			const countDownInterval = setInterval(() => {
				if (timer !== 0) {
					// run this DOM manipulation to decrement the countdown for the user
					document.getElementById('big-numbers').innerHTML = --timer
				} else {
					// if the countdown is done, clear the interval, resolve the promise, and return
					clearInterval(countDownInterval)
					resolve();
					document.getElementById('gas-peddle').disabled = false;
				}
			}, 1000);
		})
	} catch(error) {
		console.log(error);
	}
}

function handleSelectPodRacer(target) {
	console.log("selected a pod", target.id)

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// save the selected racer to the store
	store.player_id = parseInt(target.id)
}

function handleSelectTrack(target) {
	console.log("selected a track", target.id)

	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	store.track_id = parseInt(target.id)
}

function handleAccelerate() {
	accelerate(store.race_id)
		.then(() => {
			console.log("You hit the gas-pedal: keep going");
		})
		.catch((error)=>console.log(error));
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('');

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer

	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p><b>Top Speed: </b>${top_speed}</p>
			<p><b>Acceleration: </b>${acceleration}</p>
			<p><b>Handling: </b>${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}

	const results = tracks.map(renderTrackCard).join('')

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
	const { id, name } = track

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track, racers) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {
	const userPlayer = positions.find(e => e.id === store.player_id)
	userPlayer.driver_name += " (you)"

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	}
}

function getTracks() {
	// GET request to `${SERVER}/api/tracks`
	return fetch(`${SERVER}/api/tracks`)
		.then((response) => {
			return response.json();
		})
		.catch((error) => {
			console.log("The following error occured getting the tracks: " + error);
		})
}

function getRacers() {
	// GET request to `${SERVER}/api/cars`
	return fetch(`${SERVER}/api/cars`)
		.then((response) => {
			return response.json();
		})
		.catch((error) => {
			console.log("The following error occured while getting the racers: " + error);
		})
}

function createRace(player_id, track_id) {
	player_id = parseInt(player_id)
	track_id = parseInt(track_id)
	const body = { player_id, track_id }

	console.log(player_id);
	console.log(track_id);
	
	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
	.then(res => res.json())
	.catch(err => console.log("Problem with createRace request::", err))
}

function getRace(id) {
	// GET request to `${SERVER}/api/races/${id}`
	return fetch(`${SERVER}/api/races/${id}`)
		.then((response) => {
			return response.json();
		})
		.catch((error) => {
			console.log("The following error occured while getting the race status: " + error);
		})
}

function startRace(id) {
	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	.catch(err => console.log("Problem with getRace request::", err))
}

function accelerate(id) {
	// POST request to `${SERVER}/api/races/${id}/accelerate`
	// options parameter provided as defaultFetchOpts
	// no body or datatype needed for this request
	return fetch(`${SERVER}/api/races/${id}/accelerate`,{
		method: 'POST',
		...defaultFetchOpts()
	})
	.catch((error) => {
		console.log("Error while calling API::" + error)
	})
}