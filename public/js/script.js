const socket = io();
let joueurs = [null, null];
let carteCliquee = [false, false];

// // Écouter le début de la partie
// socket.on('debutPartie', (message) => {
//     console.log(message);
//     document.title = "Prêt";
//     document.getElementById('carte1').src = '/imagesCartes/carte-interro.png';
//     document.getElementById('carte2').src = '/imagesCartes/carte-interro.png';

//     // Réinitialiser le temps écoulé à zéro
//     document.getElementById('timerDisplay').textContent = 'Temps écoulé : 0 s'; // Mettre à jour l'affichage
// });

socket.on('debutPartie', (listeUtilisateurs) => {
    // console.log(message);
    document.title = "Prêt";
    document.getElementById('carte1').src = '/imagesCartes/carte-interro.png';
    document.getElementById('carte2').src = '/imagesCartes/carte-interro.png';

    // Réinitialiser le temps écoulé à zéro
    document.getElementById('timerDisplay').textContent = 'Elapsed Time: 0 s'; // Mettre à jour l'affichage
    
    // Définition des noms de joueurs dans les navigateurs 
    document.getElementById('player1').innerText = listeUtilisateurs[0];
    document.getElementById('player2').innerText = listeUtilisateurs[1];
   
});

socket.on('votreCarte', (carte, joueurId) => {
    if (joueurId === 1) {
        joueurs[0] = { carte };

    } else if (joueurId === 2) {
        joueurs[1] = { carte };
    }
    
});


// Événements de clic sur les cartes
document.addEventListener('DOMContentLoaded', () => {
    const timerDisplay = document.getElementById('timerDisplay');
    let elapsedTime = 0;

    // Écouter les mises à jour de temps du serveur
    socket.on('miseAJourTemps', (tempsEcoule) => {
        elapsedTime = tempsEcoule; // Mettre à jour le temps écoulé
        let elapsedTimeString = ""

        if (elapsedTime < 60) {
            elapsedTimeString = elapsedTime + " s";
        } else if (elapsedTime >= 60 && elapsedTime < 3600) {
            let min = Math.floor(elapsedTime / 60);
            let sec = elapsedTime % 60;  
            elapsedTimeString = min + " min " + sec + " s";
        }

        // Mettre à jour l'affichage du timer
        timerDisplay.textContent = `Elapsed Time : ${elapsedTimeString}`;
    });

    // Mettre à jour les points des joueurs

    

    // Demander le temps au serveur chaque seconde
    // setInterval(() => {
    //     socket.emit('demanderTemps'); // Envoie une demande de mise à jour de temps
    // }, 2000);

    document.getElementById('carte1').addEventListener('click', () => {
        if (!carteCliquee[0] && joueurs[0]) {
            carteCliquee[0] = true;
            socket.emit('retournerCarte', 1);
        }
    });

    document.getElementById('carte2').addEventListener('click', () => {
        if (!carteCliquee[1] && joueurs[1]) {
            carteCliquee[1] = true;
            socket.emit('retournerCarte', 2);
        }
    });

    // Gestion du chat
    const messageInput = document.getElementById('messageInput');
    const envoyerMessageButton = document.getElementById('envoyerMessage');

    envoyerMessageButton.addEventListener('click', () => {
        const message = messageInput.value;
        const joueurId = joueurs[0] ? 1 : 2; // Identifier le joueur actuel
        if (message) {
            socket.emit('messageChat', message, joueurId); // Envoyer le message avec l'ID du joueur
            messageInput.value = '';
        }
    });

    // Appuyer sur "Entrée" pour envoyer un message
    messageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            envoyerMessageButton.click();
        }
    });
});

// Afficher la carte retournée
socket.on('carteRetournee', (carte, joueurId) => {
    if (joueurId === 1) {
        document.getElementById('carte1').src = `/imagesCartes/${carte.image}`;
    } else if (joueurId === 2) {
        document.getElementById('carte2').src = `/imagesCartes/${carte.image}`;
    }
});

// Gérer le résultat
socket.on('resultat', (message) => {
    document.getElementById('resultat').textContent = message;
    document.title = message;

    // Masquer le message après 2 secondes
    setTimeout(() => {
        document.getElementById('resultat').textContent = ""; // Efface le message
        document.title = ""; // Réinitialise le titre
    }, 2000);

    resetGame();
});

socket.on('messageFinGme',data=>{
    document.getElementById('messageFinGame').textContent=data
    const messageFinGame = document.getElementById('messageFinGame');
    messageFinGame.style.display = 'block'; // Afficher la div
})

// Réinitialiser les cartes après la manche
function resetGame() {
    setTimeout(() => {
        document.getElementById('carte1').src = '/imagesCartes/carte-interro.png';
        document.getElementById('carte2').src = '/imagesCartes/carte-interro.png';
        carteCliquee = [false, false];
        joueurs = [null, null];
        document.title = "Prêt";
        socket.emit('recommencerPartie');
    }, 2000);
}

function envoyerNbParties() {
    const nbPartiesParManche = document.getElementById('nbPartiesParManche').value;
    socket.emit('nbPartiesUpdate', { nbParties: nbPartiesParManche });
}

// Mettre à jour les points des joueurs
socket.on('nbPointsJoueur1', points => {
    const { nbPointsJoueur1, listeUsers } = points; // Décomposition de l'objet reçu
    document.getElementById('nbPointsJoueur1').innerText = "Joueur "+ listeUsers[0] + " : " +nbPointsJoueur1 + " pts";
    document.getElementById('player1').innerText=listeUsers[0] 
});
socket.on('nbPointsJoueur2', points => {
    const { nbPointsJoueur2, listeUsers } = points; // Décomposition de l'objet reçu
    document.getElementById('nbPointsJoueur2').innerText = "Joueur "+ listeUsers[1] + " : " +nbPointsJoueur2 + " pts";
    document.getElementById('player2').innerText=listeUsers[1] 
});

// Affichage de l'heure
setInterval(() => {
    const now = new Date();
    const hour = now.getHours();
    const min = now.getMinutes();
    const sec = now.getSeconds();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour > 12 ? hour - 12 : hour;
    document.getElementById('time').innerText = `${formattedHour}:${min < 10 ? '0' + min : min} ${ampm}`;
}, 1000);

// Recevoir et afficher les messages de chat
socket.on('nouveauMessage', (message) => {
    const messagesContainer = document.getElementById('messages-container');
    const messageElement = document.createElement('p');
    messageElement.textContent = message; // Afficher le message avec l'auteur
    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;  // Faire défiler vers le bas pour voir le dernier message
});
