// ============================================================
//   API BANCAIRE — Système de Transactions Bancaires
//   Devoir 304
// ============================================================

const express = require('express');
const cors = require('cors'); // 1. Importer le package
const app = express();

app.use(cors()); // 2. Activer les CORS pour toutes les origines

app.use(express.json());

let comptes = [];
let prochainId = 1;

// Route reset pour les tests
app.post('/api/reset', (req, res) => {
comptes.length = 0;
let prochainId = 1;
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
  const nouveauCompte = {
    id: prochainId++,
    titulaire: titulaire,
    solde: soldeInitial || 0,
    dateCreation: new Date().toLocaleString('fr-FR'),
    historique: []
  };
  comptes.push(nouveauCompte);
  return res.status(201).json(nouveauCompte);
});

// ROUTE 2 : Liste des comptes
app.get('/api/comptes', (req, res) => {
  if (comptes.length === 0) {
    return res.status(200).json({
      message: "Aucun compte bancaire enregistré pour l'instant.",
      comptes: []
    });
  }
  return res.status(200).json(comptes);
});

// ROUTE 3 : Détail d'un compte
app.get('/api/comptes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const compte = comptes.find(c => c.id === id);
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
  const compte = comptes.find(c => c.id === id);
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
  const compte = comptes.find(c => c.id === id);
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
  comptes = [];
  prochainId = 1;
};
}

module.exports = app;