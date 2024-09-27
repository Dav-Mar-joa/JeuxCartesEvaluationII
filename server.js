const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { MongoClient } = require('mongodb')
const { EvalSourceMapDevToolPlugin } = require('webpack');
const bcrypt = require('bcrypt');
const app = express();
const session = require('express-session');
const server = http.createServer(app);
const io = new Server(server);
require('dotenv').config();

// Deck de cartes
const cartes = [
    { nom: 'As de Pique', image: 'As.gif', valeur: 14 },
    { nom: 'Roi de Pique', image: 'Ks.gif', valeur: 13 },
    { nom: 'Dame de Pique', image: 'Qs.gif', valeur: 12 },
    { nom: 'Valet de Pique', image: 'Js.gif', valeur: 11 },
    { nom: '10 de Pique', image: '10s.gif', valeur: 10 },
    { nom: '9 de Pique', image: '9s.gif', valeur: 9 },
    { nom: '8 de Pique', image: '8s.gif', valeur: 8 },
    { nom: '7 de Pique', image: '7s.gif', valeur: 7 },
    { nom: '6 de Pique', image: '6s.gif', valeur: 6 },
    { nom: '5 de Pique', image: '5s.gif', valeur: 5 },
    { nom: '4 de Pique', image: '4s.gif', valeur: 4 },
    { nom: '3 de Pique', image: '3s.gif', valeur: 3 },
    { nom: '2 de Pique', image: '2s.gif', valeur: 2 },
    { nom: 'Game Over', image: 'gameOver.png', valeur: 0 },
    { nom: 'As de Coeur', image: 'Ah.gif', valeur: 14 },
    { nom: 'Roi de Coeur', image: 'Kh.gif', valeur: 13 },
    { nom: 'Dame de Coeur', image: 'Qh.gif', valeur: 12 },
    { nom: 'Valet de Coeur', image: 'Jh.gif', valeur: 11 },
    { nom: '10 de Coeur', image: '10h.gif', valeur: 10 },
    { nom: '9 de Coeur', image: '9h.gif', valeur: 9 },
    { nom: '8 de Coeur', image: '8h.gif', valeur: 8 },
    { nom: '7 de Coeur', image: '7h.gif', valeur: 7 },
    { nom: '6 de Coeur', image: '6h.gif', valeur: 6 },
    { nom: '5 de Coeur', image: '5h.gif', valeur: 5 },
    { nom: '4 de Coeur', image: '4h.gif', valeur: 4 },
    { nom: '3 de Coeur', image: '3h.gif', valeur: 3 },
    { nom: '2 de Coeur', image: '2h.gif', valeur: 2 },
    { nom: 'Game Over', image: 'gameOver.png', valeur: 0 },
    { nom: 'As de Carreau', image: 'Ad.gif', valeur: 14 },
    { nom: 'Roi de Carreau', image: 'Kd.gif', valeur: 13 },
    { nom: 'Dame de Carreau', image: 'Qd.gif', valeur: 12 },
    { nom: 'Valet de Carreau', image: 'Jd.gif', valeur: 11 },
    { nom: '10 de Carreau', image: '10d.gif', valeur: 10 },
    { nom: '9 de Carreau', image: '9d.gif', valeur: 9 },
    { nom: '8 de Carreau', image: '8d.gif', valeur: 8 },
    { nom: '7 de Carreau', image: '7d.gif', valeur: 7 },
    { nom: '6 de Carreau', image: '6d.gif', valeur: 6 },
    { nom: '5 de Carreau', image: '5d.gif', valeur: 5 },
    { nom: '4 de Carreau', image: '4d.gif', valeur: 4 },
    { nom: '3 de Carreau', image: '3d.gif', valeur: 3 },
    { nom: '2 de Carreau', image: '2d.gif', valeur: 2 },
    { nom: 'Game Over', image: 'gameOver.png', valeur: 0 },
    { nom: 'As de Trèfle', image: 'Ac.gif', valeur: 14 },
    { nom: 'Roi de Trèfle', image: 'Kc.gif', valeur: 13 },
    { nom: 'Dame de Trèfle', image: 'Qc.gif', valeur: 12 },
    { nom: 'Valet de Trèfle', image: 'Jc.gif', valeur: 11 },
    { nom: '10 de Trèfle', image: '10c.gif', valeur: 10 },
    { nom: '9 de Trèfle', image: '9c.gif', valeur: 9 },
    { nom: '8 de Trèfle', image: '8c.gif', valeur: 8 },
    { nom: '7 de Trèfle', image: '7c.gif', valeur: 7 },
    { nom: '6 de Trèfle', image: '6c.gif', valeur: 6 },
    { nom: '5 de Trèfle', image: '5c.gif', valeur: 5 },
    { nom: '4 de Trèfle', image: '4c.gif', valeur: 4 },
    { nom: '3 de Trèfle', image: '3c.gif', valeur: 3 },
    { nom: '2 de Trèfle', image: '2c.gif', valeur: 2 }
];

// Joueurs
let joueurs = [];
let nbPartiesParManche = 10;
let cartesRetournees = [false, false];
let nbPointsJoueur1 = 0;
let nbPointsJoueur2 = 0;
let manche = 0;
let elapsedTime = 0; // Temps écoulé en secondes
let usernames = [];
let nbPointsJoueurs1Final=0
let nbPointsJoueurs2Final=0
let timerInterval;

//david
async function miseAjourPoint(points,joueur,duree){
    const collection = db.collection(process.env.MONGODB_COLLECTION);
    const user = await collection.findOne({ identifiant: joueur });
    const oldPoints = user.rate
    let nbrParties = user.nbGames +1
    let newPoints = parseFloat(oldPoints) + parseFloat(points);
    newPoints=parseFloat(newPoints.toFixed(2))
    let tempsSecond = user.timeSecond + duree
    let heure =Math.floor(tempsSecond/3600)
    let min = Math.floor((tempsSecond-heure*3600)/60)
    let sec = tempsSecond-3600*heure-3600*heure-60*min
    let tempsString = heure+"h "+min+"min "+sec

    const player = await collection.findOneAndUpdate(
        { identifiant: joueur }, // Trouve le joueur par identifiant
        { $set: { rate: newPoints ,nbGames: nbrParties, timeSecond:tempsSecond,timeString: tempsString }}, // Met à jour le score du joueur
        { new: true } // Retourne le document mis à jour
      );
}

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Assurez-vous que ce paramètre est approprié pour votre environnement
  }));
// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Définir Pug comme moteur de vue
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connectionString =
//   "mongodb://" + process.env.mongodb_host + ":" + process.env.mongodb_port;
"mongodb+srv://davidjoaquimmartins:david@clusterd.gllspzx.mongodb.net/"
const client = new MongoClient(connectionString);
const dbName = process.env.mongodb_dbname;

let db;
async function connectDB() {
    try {
        await client.connect();
        db = client.db(dbName);
        console.log('Connecté à la base de données MongoDB');
    } catch (err) {
        console.error('Erreur de connexion à la base de données :', err);
    }
}
connectDB();

// Route principale
app.get('/', (req, res) => {
    if (req.session.username) {
      console.log("/index")
        console.log(req.session.username)
        // Si l'utilisateur est authentifié, on affiche la page d'accueil (ou de jeu)
        res.render('index', { username: req.session.username });
    } else {
        // Si l'utilisateur n'est pas authentifié, on le redirige vers la page de connexion
        res.redirect('/login');
    }
});
app.get('/login', (req, res) => {
    res.render('login');
});
const listeUsers = []
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log("Username: " + username);
    console.log("Password: " + password);
  
    try {
      const collection = db.collection(process.env.MONGODB_COLLECTION);
      const user = await collection.findOne({ identifiant: username });
  
      if (user) {
        // Compare le mot de passe fourni avec le mot de passe haché
        const match = await bcrypt.compare(password, user.password);
        if (match) {
          req.session.username = username; // Enregistre le nom d'utilisateur dans la session
          listeUsers.push(username)
          res.redirect('/'); // Redirige vers la page d'accueil
        } else {
          res.render('login', { error: 'Identifiant ou mot de passe incorrect' });
        }
      } else {
        res.render('login', { error: 'Identifiant ou mot de passe incorrect' });
      }
    } catch (err) {
      console.error('Erreur lors de la connexion :', err);
      res.status(500).send('Erreur serveur');
    }
});
app.get('/register', (req, res) => {
    res.render('register'); // Render la vue d'inscription
});
app.post('/register', async (req, res) => {
    const { username, firstname, lastname, password } = req.body;
    console.log('Données reçues:', { username, firstname, lastname, password }); // Affiche les données reçues dans la console

    // Vérifiez si db est bien initialisé
    if (!db) {
        return res.status(500).send('Erreur de connexion à la base de données.');
    }

    // Hachage du mot de passe (recommandé)
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10); // Utilisation de bcrypt pour hacher le mot de passe

    const newUser = {
        identifiant: username,
        firstName: firstname,
        lastName: lastname,
        password: hashedPassword,
        rate: 0,
        nbGames: 0,
        timeSecond:0,
        timeString:"",
    };

    try {
        // Vérification de l'existence de l'utilisateur
        const existingUser = await db.collection(process.env.MONGODB_COLLECTION).findOne({ identifiant: username });
        console.log('Utilisateur existant:', existingUser);

        if (existingUser) {
            return res.render('register', { msg: 'Identifiant déjà utilisé, essayez encore !' });
        }

        // Insertion du nouvel utilisateur
        const insertResult = await db.collection(process.env.MONGODB_COLLECTION).insertOne(newUser);
        console.log('Résultat d\'insertion:', insertResult);

        // Redirection vers la page de connexion après succès
        res.redirect('/login');
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.render('register', { error: 'Une erreur est survenue lors de l\'inscription' });
    }
});
app.get('/ranking', async (req, res) => {
    console.log("Route GET /ranking atteinte");
    console.log("Collection utilisée :", process.env.mongodb_collection);

    try {
        console.log("Tentative de récupération des classements...");
        const collection = db.collection(process.env.mongodb_collection);
        const result = await collection.find({}).sort({rate : -1}).toArray();
        console.log("Résultat :", result);
        
        // Rendre la vue après avoir récupéré les données
        res.render('ranking', { rankings: result.length > 0 ? result : [] }); // Passer un tableau vide si aucun résultat
    } catch (error) {
        console.error('Erreur lors du chargement des joueurs :', error);
        res.status(500).send('Erreur serveur');
    }
});
//   console.log("Route GET /ranking atteinte");

  app.get('/game', (req, res) => {
    res.redirect('/');
  });
//   app.post('/ranking', async (req, res) => {
//     console.log("Tentative de récupération des classements...");
//     try {
//         const collection = db.collection(process.env.mongodb_collection);
//         const result = await collection.find({}).toArray();
//         console.log("Résultat :", result);
//         res.render('ranking', { rankings: result.length > 0 ? result : [] }); // Passer un tableau vide si aucun résultat
//     } catch (error) {
//         console.error('Erreur lors du chargement des joueurs :', error);
//         res.status(500).send('Erreur serveur');
//     }
// });

// Démarrer le serveur
// app.listen(process.env.port, () => {
//     console.log(`Serveur lancé sur le port ${process.env.port}`);
// });  

//------------------------------------------------------------------------

// Gérer les connexions Socket.IO
io.on('connection', (socket) => {
    console.log('Un joueur est connecté');
    joueurs.push(socket);
    console.log("liste des users en début de io : "+listeUsers)
    console.log("liste des users en début de io tableau 0 : "+listeUsers[0])
    console.log("liste des users en début de io tableau 1 : "+listeUsers[1])
     socket.emit('nomJoueurs', listeUsers);

   ///// recuperation des usernamen lors de la connection  !!!

    if (joueurs.length === 2) {
        debutPartie();
        // startTimer() 
    }


    socket.on('nbPartiesUpdate', (data) => {
        nbPartiesParManche = data.nbParties;
        console.log("nbPartiesParManche mis à jour : " + nbPartiesParManche);
    });

    // Démarrer un timer côté serveur
    timerInterval = setInterval(() => {
        elapsedTime++;
        io.emit('miseAJourTemps', elapsedTime); // Envoyer le temps écoulé à tous les clients
    }, 2000); // Intervalle d'une seconde;

    socket.on('retournerCarte', (joueurId) => {
        const carte = joueurs[joueurId - 1].carte;
        io.emit('carteRetournee', carte, joueurId);
        cartesRetournees[joueurId - 1] = true;

        if (cartesRetournees[0] && cartesRetournees[1]) {
            evaluerManche();
        }
    });

    socket.on('messageChat', (message, joueurId) => {
        let auteur = "";
        console.log("joueur1 "+ listeUsers[0])
        console.log("joueur2 "+ listeUsers[1])
        if(joueurId==1){
            auteur += listeUsers[0]
        }
        if(joueurId==2)
            auteur += listeUsers[1]

        const messageAvecAuteur = `${auteur} : ${message}`;
        io.emit('nouveauMessage', messageAvecAuteur);
    });
    socket.on('envoyerTemps', (tempsEcoule) => {
        console.log(`Temps reçu du client: ${tempsEcoule} secondes`);
    })

    socket.on('disconnect', () => {
        console.log('Joueur déconnecté');
        joueurs = joueurs.filter((joueur) => joueur !== socket);
        clearInterval(timerInterval); // Arrêter le timer si le joueur se déconnecte
        // listeUsers.length = 0;
    });
});

// function startTimer() {
//     elapsedTime = 0; // Réinitialiser le temps écoulé
//     clearInterval(timerInterval); // S'assurer qu'aucun autre timer n'est en cours
//     timerInterval = setInterval(() => {
//         elapsedTime++;
//         io.emit('miseAJourTemps', elapsedTime); // Envoyer le temps écoulé à tous les clients
//     }, 1000); // Intervalle d'une seconde
// }

// Fonction pour débuter la partie
function debutPartie() {
    manche = 0;
    nbPointsJoueur1 = 0;
    nbPointsJoueur2 = 0;
    elapsedTime = 0; // Réinitialiser le temps
    io.emit('debutPartie', 'La partie commence !');
    io.emit('debutPartie', listeUsers);
    prochaineManche();
}

// Tirer une carte aléatoire
function tirerCarte() {
    const index = Math.floor(Math.random() * cartes.length);
    return cartes[index];
} 

// Prochaine manche
function prochaineManche() {
    if (nbPointsJoueur1 < nbPartiesParManche && nbPointsJoueur2 < nbPartiesParManche) {
        console.log("nbpartiesparmanches : " + nbPartiesParManche)
        const cartesJoueurs = joueurs.map(() => tirerCarte());
        joueurs[0].carte = cartesJoueurs[0];
        joueurs[1].carte = cartesJoueurs[1];
        joueurs[0].emit('votreCarte', cartesJoueurs[0], 1);
        joueurs[1].emit('votreCarte', cartesJoueurs[1], 2);
        cartesRetournees = [false, false];
    } else {
        finDePartie();
        let messageFinGame;
    if (nbPointsJoueur1 > nbPointsJoueur2) {
        // messageFinGame = "Joueur 1 est Winner";
        messageFinGame = `${listeUsers[0]} is Winner !!`;
        let nbrTotalPoints = (Math.abs(nbPointsJoueur2)+Math.abs(nbPointsJoueur1))
        nbPointsJoueurs1Final = nbPointsJoueur1/nbrTotalPoints
        nbPointsJoueurs2Final = nbPointsJoueur2/nbrTotalPoints
        //david
        miseAjourPoint(nbPointsJoueurs1Final,listeUsers[0],elapsedTime)
        miseAjourPoint(nbPointsJoueurs2Final,listeUsers[1],elapsedTime)
    } else {
        // messageFinGame = "Joueur 2 est Winner";
        messageFinGame = `${listeUsers[1]} is Winner !!`;
        let nbrTotalPoints = (Math.abs(nbPointsJoueur2)+Math.abs(nbPointsJoueur1))
        nbPointsJoueurs1Final = nbPointsJoueur1/nbrTotalPoints
        nbPointsJoueurs2Final = nbPointsJoueur2/nbrTotalPoints
        //david
        miseAjourPoint(nbPointsJoueurs1Final,listeUsers[0],elapsedTime)
        miseAjourPoint(nbPointsJoueurs2Final,listeUsers[1],elapsedTime)
        // socket.on('envoyerTemps', (tempsEcoule) => {
        //     console.log(`Temps reçu du client: ${tempsEcoule} secondes`);
        // })

        
    }

    io.emit('messageFinGme', messageFinGame); // Envoyer le message ici
    }
}

// Évaluer la manche
function evaluerManche() {
    const carte1 = joueurs[0].carte.valeur;
    const carte2 = joueurs[1].carte.valeur;
    console.log("carte 1 " +joueurs[0].carte.valeur)
    console.log("carte 2 " +joueurs[1].carte.valeur)
    console.log("carte 1 nom " +joueurs[0].carte.nom)
    console.log("carte 2 nom " +joueurs[1].carte.nom)
    

    let message;
    if (carte1 > carte2) {
        // message = 'Joueur 1 a gagné avec ' + joueurs[0].carte.nom;
        message = `${listeUsers[0]} a gagné avec ` + joueurs[0].carte.nom;
        listeUsers[0]
        nbPointsJoueur1++;
    } else if (carte1 < carte2) {
        // message = 'Joueur 2 a gagné avec ' + joueurs[1].carte.nom;
        message = 'Joueur 2 a gagné avec ' + joueurs[1].carte.nom;
        message = `${listeUsers[1]} a gagné avec ` + joueurs[1].carte.nom;
        nbPointsJoueur2++;
    } else {
        message = 'C\'est une égalité !';
    }

    if(joueurs[0].carte.nom=="Game Over"){
        nbPointsJoueur1=nbPointsJoueur1-2
    }
    if(joueurs[1].carte.nom=="Game Over"){
        nbPointsJoueur2=nbPointsJoueur2-2
    }

    io.emit('resultat', message);
    // io.emit('nbPointsJoueur1', nbPointsJoueur1);
    // io.emit('nbPointsJoueur2', nbPointsJoueur2);
    console.log(" dans message list: "+listeUsers);

    io.emit('nbPointsJoueur1', {nbPointsJoueur1,listeUsers});
    io.emit('nbPointsJoueur2', {nbPointsJoueur2,listeUsers});

    setTimeout(() => {
        io.emit('reinitialiserCartes');
        prochaineManche();
    }, 3000);
}

// Fin de la partie
function finDePartie() {
    let message = 'Fin de la partie ! ';
    if (nbPointsJoueur1 > nbPointsJoueur2) {
        message += 'Le Joueur 1 gagne avec ' + nbPointsJoueur1 + ' points.';
    } else if (nbPointsJoueur1 < nbPointsJoueur2) {
        message += 'Le Joueur 2 gagne avec ' + nbPointsJoueur2 + ' points.';
    } else {
        message += 'C\'est une égalité parfaite !';
    }
    io.emit('finDePartie', message);
}

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) {
        return res.redirect('/');
      }
      res.redirect('/login');
      listeUsers.length = 0;
    });
  });

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Serveur démarré sur le port ${PORT}`);
});
