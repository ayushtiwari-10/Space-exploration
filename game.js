let scene, camera, renderer, rocket, sun, planets, stars, earth, clouds, ground;
let launchBtn, countdownEl, viewSelect, infoBtn, planetSelect;
let isLaunched = false;
let launchProgress = 0;
let currentView = 'launch';
let currentPlanet = null;
let rocketTarget = null;
let earthOrbitRadius = 2;
let earthOrbitAngle = 0;
let earthOrbitSpeed = 0.005;
let solarSystemReady = false;

const planetData = [
    { name: 'Mercury', radius: 0.383, distance: 57.9, color: 0xC4C4C4, speed: 0.00059 ,         info: [
        "Smallest planet in the solar system",
        "Closest planet to the Sun",
        "No atmosphere, extreme temperature variations",
        "Heavily cratered surface",
        "Day length: 58.6 Earth days",
        "Year length: 88 Earth days",
        "No moons"
    ] },
    { name: 'Venus', radius: 0.949, distance: 108.2, color: 0xFFC649, speed: 0.00044 },
    { name: 'Earth', radius: 1, distance: 149.6, color: 0x2233ff, speed: 0.00037 },
    { name: 'Mars', radius: 0.532, distance: 227.9, color: 0xE27B58, speed: 0.00030 },
    { name: 'Jupiter', radius: 11.21, distance: 778.5, color: 0xE3DCCB, speed: 0.00016 },
    { name: 'Saturn', radius: 9.45, distance: 1434, color: 0xF7E7C4, speed: 0.00012 },
    { name: 'Uranus', radius: 4, distance: 2871, color: 0xCAF1F2, speed: 0.00008 },
    { name: 'Neptune', radius: 3.88, distance: 4495, color: 0x5B5DDF, speed: 0.00006 }
];


function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);

    createGround();
    createClouds();
    createRocket();
    createEarth();

    camera.position.set(0, 5, 20);
    camera.lookAt(rocket.position);

    launchBtn = document.getElementById('launch-btn');
    countdownEl = document.getElementById('countdown');
    viewSelect = document.getElementById('view-select');
    infoBtn = document.getElementById('info-btn');
    planetSelect = document.getElementById('planet-select');

    launchBtn.addEventListener('click', startLaunch);
    viewSelect.addEventListener('change', changeView);
    infoBtn.addEventListener('click', showInfo);
    planetSelect.addEventListener('change', selectPlanet);

    // Hide view select and planet select initially
    viewSelect.style.display = 'none';
    planetSelect.style.display = 'none';

    // Populate planet select dropdown
    planetData.forEach(planet => {
        const option = document.createElement('option');
        option.value = planet.name;
        option.textContent = planet.name;
        planetSelect.appendChild(option);
    });
    viewSelect.addEventListener('change', changeView);
    planetSelect.addEventListener('change', selectPlanet);

    // Hide controls initially
    document.getElementById('controls').style.display = 'none';
    animate();
}

function createGround() {
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x008000 });
    ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);
}

function createClouds() {
    clouds = new THREE.Group();
    const cloudGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const cloudMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.8 });

    for (let i = 0; i < 50; i++) {
        const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
        cloud.position.set(
            Math.random() * 40 - 20,
            Math.random() * 3 + 5,
            Math.random() * 40 - 20
        );
        cloud.scale.set(Math.random() + 0.5, Math.random() + 0.3, Math.random() + 0.5);
        clouds.add(cloud);
    }
    scene.add(clouds);
}

function createRocket() {
    const rocketGeometry = new THREE.ConeGeometry(0.5, 2, 32);
    const rocketMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc });
    rocket = new THREE.Mesh(rocketGeometry, rocketMaterial);
    rocket.position.set(0, 1, 0);
    rocket.rotation.x = Math.PI;
    scene.add(rocket);
}

function createEarth() {
    const earthGeometry = new THREE.SphereGeometry(1, 32, 32);
    const earthMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x2233ff,
        specular: 0x333333,
        shininess: 5,
        map: new THREE.TextureLoader().load('https://threejsfundamentals.org/threejs/resources/images/world.jpg'),
    });
    earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.y = -11; // Mostly below the "ground" initially
    scene.add(earth);
}

function createSolarSystem() {
    createSun();
    createPlanets();
    createStars();
    solarSystemReady = true;
}

function createSun() {
    const sunGeometry = new THREE.SphereGeometry(20, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
}

function createPlanets() {
    planets = [];
    planetData.forEach(data => {
        const planetGeometry = new THREE.SphereGeometry(data.radius * 2, 32, 32);
        const planetMaterial = new THREE.MeshPhongMaterial({ color: data.color });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planet.position.x = data.distance;
        planet.userData = { name: data.name, speed: data.speed, orbitRadius: data.distance };
        scene.add(planet);
        planets.push(planet);
        if (data.name === 'Earth') {
            earth = planet;
            currentPlanet = earth;
        }
    });
}

function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xFFFFFF, size: 0.1 });

    const starVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
    }

    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function startLaunch() {
    launchBtn.disabled = true;
    let countdown = 10;
    const countdownInterval = setInterval(() => {
        countdownEl.textContent = countdown;
        countdown--;
        if (countdown < 0) {
            clearInterval(countdownInterval);
            countdownEl.textContent = "Liftoff!";
            isLaunched = true;
            setTimeout(() => {
                countdownEl.textContent = "";
            }, 2000);
        }
    }, 1000);
    setTimeout(() => {
        document.getElementById('controls').style.display = 'block';
    }, 2000);
}


function changeView() {
    currentView = viewSelect.value;
    switch(currentView) {
        case 'earth':
            camera.position.set(0, 5, 20);
            camera.lookAt(earth.position);
            break;
        case 'rocket':
            // Will be updated in animate function
            break;
        case 'full':
            camera.position.set(0, 1000, 2000);
            camera.lookAt(scene.position);
            break;
        case 'centric':
            if (currentPlanet) setCentricView();
            break;
    }
}

function setCentricView() {
    if (!currentPlanet) return;
    const distance = currentPlanet.geometry.parameters.radius * 10;
    camera.position.set(
        currentPlanet.position.x,
        currentPlanet.position.y + distance / 2,
        currentPlanet.position.z + distance
    );
    camera.lookAt(currentPlanet.position);
}

function selectPlanet() {
    const selectedPlanetName = planetSelect.value;
    rocketTarget = planets.find(planet => planet.userData.name === selectedPlanetName);
    if (rocketTarget) {
        currentPlanet = rocketTarget;
        if (currentView === 'centric') {
            setCentricView();
        }
    }
}

function showInfo() {
    if (currentPlanet) {
        const planetInfo = planetData.find(p => p.name === currentPlanet.userData.name);
        document.getElementById('planet-name').textContent = planetInfo.name;
        document.getElementById('planet-info').textContent = `Distance from Sun: ${planetInfo.distance} million km`;
    } else {
        document.getElementById('planet-name').textContent = 'No Planet Selected';
        document.getElementById('planet-info').textContent = 'Please select a planet from the dropdown.';
    }
}

function animate() {
    requestAnimationFrame(animate);

    if (isLaunched) {
        if (launchProgress < 1) {
            launchProgress += 0.005;
            rocket.position.y = 1 + launchProgress * 20;
            camera.position.y = 5 + launchProgress * 15;
            
            ground.material.opacity = 1 - launchProgress;
            ground.material.transparent = true;
            clouds.children.forEach(cloud => {
                cloud.material.opacity = 0.8 * (1 - launchProgress);
            });

            earth.position.y = -11 + launchProgress * 11;

            scene.background = new THREE.Color(0x87CEEB).lerp(new THREE.Color(0x000000), launchProgress);

            if (launchProgress >= 1) {
                scene.remove(ground);
                scene.remove(clouds);
                currentView = 'earth';
                viewSelect.style.display = 'inline-block';
                planetSelect.style.display = 'inline-block';
                setTimeout(createSolarSystem, 5000); // Create solar system after 5 seconds in Earth orbit
            }
        } else if (currentView === 'earth') {
            // Earth orbit
            earthOrbitAngle += earthOrbitSpeed;
            rocket.position.x = earth.position.x + Math.cos(earthOrbitAngle) * earthOrbitRadius;
            rocket.position.z = earth.position.z + Math.sin(earthOrbitAngle) * earthOrbitRadius;
            rocket.position.y = earth.position.y;
            rocket.lookAt(earth.position);

            camera.position.x = earth.position.x + Math.cos(earthOrbitAngle) * (earthOrbitRadius + 5);
            camera.position.z = earth.position.z + Math.sin(earthOrbitAngle) * (earthOrbitRadius + 5);
            camera.position.y = earth.position.y + 3;
            camera.lookAt(earth.position);
        } else if (solarSystemReady) {
            // Update planet positions
            planets.forEach(planet => {
                const angle = Date.now() * planet.userData.speed;
                planet.position.x = Math.cos(angle) * planet.userData.orbitRadius;
                planet.position.z = Math.sin(angle) * planet.userData.orbitRadius;
            });

            // Update rocket position
            if (rocketTarget) {
                const direction = new THREE.Vector3().subVectors(rocketTarget.position, rocket.position);
                if (direction.length() > 5) {
                    rocket.position.add(direction.normalize().multiplyScalar(2));
                    rocket.lookAt(rocketTarget.position);
                } else {
                    currentPlanet = rocketTarget;
                    rocketTarget = null;
                }
            } else if (currentPlanet) {
                // Orbit current planet
                const orbitRadius = currentPlanet.geometry.parameters.radius * 3;
                earthOrbitAngle += earthOrbitSpeed * 2;
                rocket.position.x = currentPlanet.position.x + Math.cos(earthOrbitAngle) * orbitRadius;
                rocket.position.z = currentPlanet.position.z + Math.sin(earthOrbitAngle) * orbitRadius;
                rocket.lookAt(currentPlanet.position);
            }

            // Update camera for different views
            switch(currentView) {
                case 'earth':
                    camera.position.set(earth.position.x, earth.position.y + 10, earth.position.z + 40);
                    camera.lookAt(earth.position);
                    break;
                case 'rocket':
                    const offset = new THREE.Vector3(0, 2, 10);
                    offset.applyQuaternion(rocket.quaternion);
                    camera.position.copy(rocket.position).add(offset);
                    camera.lookAt(rocket.position);
                    break;
                case 'centric':
                    if (currentPlanet) setCentricView();
                    break;
                case 'full':
                    camera.lookAt(scene.position);
                    break;
            }
        }
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();