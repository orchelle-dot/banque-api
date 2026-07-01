// ============================================================
//   API BANCAIRE — Système de Transactions Bancaires
//   Devoir 304 (Sauvegarde Persistante par Fichier)
// ============================================================

const express = require('express');
const cors = require('cors');
const fs = require('fs'); // Pour lire et écrire dans un fichier
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

const FILE_PATH = path.join(__dirname, 'comptes.json');

// Fonctions utilitaires pour manipuler le fichier JSON
function lireDonnees() {
  try {
    if (!fs.existsSync(FILE_PATH)) {
      // Si le fichier n'existe pas, on l'initialise
      const initialData = { comptes: [], prochainId: 1 };
      fs.writeFileSync(FILE_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    const contenu = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(contenu);
  } catch (error) {
    console.error("Erreur lors de la lecture du fichier JSON :", error);
    return { comptes: [], prochainId: 1 };
  }
}

function sauvegarderDonnees(data) {
  try {
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Erreur lors de l'écriture du fichier JSON :", error);
  }
}

// Route reset pour les tests
app.post('/api/reset', (req, res) => {
  const data = { comptes: [], prochainId: 1 };
  sauvegarderDonnees(data);
  return res.status(200).json({ message: 'Données réinitialisées' });
});

// ROUTE 1 : Créer un compte
app.post('/api/comptes', (req, res) => {
  const { titulaire, soldeInitial } = req.body;
  if (!titulaire) {
    return res.status(400).json({ erreur: "Le nom du titulaire est obligatoire." });
  }
  if (soldeInitial < 0) {
    return res.status(400).json({ erreur: "Le solde initial ne peut pas être négatif." });
  }

  const data = lireDonnees();

  const nouveauCompte = {
    id: data.prochainId++,
    titulaire: titulaire,
    solde: soldeInitial || 0,
    dateCreation: new Date().toLocaleString('fr-FR'),
    historique: []
  };

  data.comptes.push(nouveauCompte);
  sauvegarderDonnees(data); // Sauvegarde automatique

  return res.status(201).json(nouveauCompte);
});

// ROUTE 2 : Liste des comptes
app.get('/api/comptes', (req, res) => {
  const data = lireDonnees();
  if (data.comptes.length === 0) {
    return res.status(200).json({
      message: "Aucun compte bancaire enregistré pour l'instant.",
      comptes: []
    });
  }
  return res.status(200).json(data.comptes);
});

// ROUTE 3 : Détail d'un compte
app.get('/api/comptes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const data = lireDonnees();
  const compte = data.comptes.find(c => c.id === id);
  if (!compte) {
    return res.status(404).json({ erreur: "Compte introuvable. Vérifiez l'identifiant." });
  }
  return res.status(200).json({
    id: compte.id,
    titulaire: compte.titulaire,
    solde: `${compte.solde} FCFA`,
    dateCreation: compte.dateCreation,
    historique: compte.historique
  });
});

// ROUTE 4 : Dépôt
app.post('/api/comptes/:id/depot', (req, res) => {
  const id = parseInt(req.params.id);
  const { montant } = req.body;
  
  const data = lireDonnees();
  const compte = data.comptes.find(c => c.id === id);

  if (!compte) {
    return res.status(404).json({ erreur: "Compte introuvable. Vérifiez l'identifiant." });
  }
  if (!montant || montant <= 0) {
    return res.status(400).json({ erreur: "Le montant du dépôt doit être supérieur à zéro." });
  }

  compte.solde += montant;
  compte.historique.push({
    type: "Dépôt",
    montant: `${montant} FCFA`,
    dateEtHeure: new Date().toLocaleString('fr-FR')
  });

  sauvegarderDonnees(data); // Sauvegarde après modification du solde

  return res.status(200).json({
    message: "Dépôt effectué avec succès.",
    titulaire: compte.titulaire,
    nouveauSolde: `${compte.solde} FCFA`,
    heureOperation: new Date().toLocaleString('fr-FR')
  });
});

// ROUTE 5 : Retrait
app.post('/api/comptes/:id/retrait', (req, res) => {
  const id = parseInt(req.params.id);
  const { montant } = req.body;

  const data = lireDonnees();
  const compte = data.comptes.find(c => c.id === id);

  if (!compte) {
    return res.status(404).json({ erreur: "Compte introuvable. Vérifiez l'identifiant." });
  }
  if (!montant || montant <= 0) {
    return res.status(400).json({ erreur: "Le montant du retrait doit être supérieur à zéro." });
  }
  if (montant > compte.solde) {
    return res.status(400).json({
      erreur: "Solde insuffisant pour effectuer ce retrait.",
      soldeActuel: compte.solde
    });
  }

  compte.solde -= montant;
  compte.historique.push({
    type: "Retrait",
    montant: `${montant} FCFA`,
    dateEtHeure: new Date().toLocaleString('fr-FR')
  });

  sauvegarderDonnees(data); // Sauvegarde après modification du solde

  return res.status(200).json({
    message: "Retrait effectué avec succès.",
    titulaire: compte.titulaire,
    nouveauSolde: `${compte.solde} FCFA`,
    heureOperation: new Date().toLocaleString('fr-FR')
  });
});

// ============================================================
// DÉMARRAGE DU SERVEUR
// ============================================================
const PORT = 3000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('');
    console.log('======================================');
    console.log('   Serveur bancaire démarré !');
    console.log(`   Adresse : http://localhost:${PORT}`);
    console.log('======================================');
  });
  app.resetData = () => {
    const data = { comptes: [], prochainId: 1 };
    sauvegarderDonnees(data);
  };
}

module.exports = app;