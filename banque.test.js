// ============================================================
//   TESTS UNITAIRES ET D'INTÉGRATION — API Bancaire
//   Devoir 304
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from './index.js';

// Réinitialiser les données avant chaque test
beforeEach(async () => {
  await request(app).post('/api/reset');
});

// ============================================================
// TESTS UNITAIRES — Fonction 1 : Créer un compte
// ============================================================
describe('Fonction 1 — POST /api/comptes — Créer un compte', () => {

  it('T1-01 : doit créer un compte avec des données valides', async () => {
    const res = await request(app)
      .post('/api/comptes')
      .send({ titulaire: 'Orchelle Lomboue', soldeInitial: 120000 });
    expect(res.status).toBe(201);
    expect(res.body.titulaire).toBe('Orchelle Lomboue');
    expect(res.body.solde).toBe(120000);
    expect(res.body.id).toBeDefined();
  });

  it('T1-02 : doit créer un compte sans solde initial (solde = 0)', async () => {
    const res = await request(app)
      .post('/api/comptes')
      .send({ titulaire: 'Jean Dupont' });
    expect(res.status).toBe(201);
    expect(res.body.solde).toBe(0);
  });

  it('T1-03 : doit refuser si le titulaire est manquant', async () => {
    const res = await request(app)
      .post('/api/comptes')
      .send({ soldeInitial: 5000 });
    expect(res.status).toBe(400);
    expect(res.body.erreur).toBe('Le nom du titulaire est obligatoire.');
  });

  it('T1-04 : doit refuser si le solde initial est négatif', async () => {
    const res = await request(app)
      .post('/api/comptes')
      .send({ titulaire: 'Marie', soldeInitial: -5000 });
    expect(res.status).toBe(400);
    expect(res.body.erreur).toBe('Le solde initial ne peut pas être négatif.');
  });
});

// ============================================================
// TESTS UNITAIRES — Fonction 2 : Liste des comptes
// ============================================================
describe('Fonction 2 — GET /api/comptes — Liste des comptes', () => {

  it('T2-01 : doit retourner la liste quand des comptes existent', async () => {
    await request(app).post('/api/comptes').send({ titulaire: 'Test', soldeInitial: 1000 });
    const res = await request(app).get('/api/comptes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('T2-02 : doit retourner un message si aucun compte', async () => {
    const res = await request(app).get('/api/comptes');
    expect(res.status).toBe(200);
    expect(res.body.comptes).toEqual([]);
  });
});

// ============================================================
// TESTS UNITAIRES — Fonction 3 : Détail d'un compte
// ============================================================
describe("Fonction 3 — GET /api/comptes/:id — Détail compte", () => {

  it("T3-01 : doit retourner le détail d'un compte existant", async () => {
    const create = await request(app)
      .post('/api/comptes')
      .send({ titulaire: 'Orchelle', soldeInitial: 50000 });
    const id = create.body.id;
    const res = await request(app).get(`/api/comptes/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.titulaire).toBe('Orchelle');
    expect(res.body.historique).toBeDefined();
  });

  it("T3-02 : doit retourner 404 si le compte n'existe pas", async () => {
    const res = await request(app).get('/api/comptes/9999');
    expect(res.status).toBe(404);
    expect(res.body.erreur).toBe("Compte introuvable. Vérifiez l'identifiant.");
  });
});

// ============================================================
// TESTS D'INTÉGRATION — Fonction 4 : Dépôt
// ============================================================
describe('Fonction 4 — POST /api/comptes/:id/depot — Dépôt', () => {

  it('T4-01 : doit effectuer un dépôt valide', async () => {
    const create = await request(app)
      .post('/api/comptes')
      .send({ titulaire: 'Orchelle', soldeInitial: 10000 });
    const id = create.body.id;
    const res = await request(app)
      .post(`/api/comptes/${id}/depot`)
      .send({ montant: 5000 });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Dépôt effectué avec succès.');
    expect(res.body.nouveauSolde).toBe('15000 FCFA');
  });

  it('T4-02 : doit refuser un dépôt sur un compte inexistant', async () => {
    const res = await request(app)
      .post('/api/comptes/9999/depot')
      .send({ montant: 5000 });
    expect(res.status).toBe(404);
  });

  it('T4-03 : doit refuser un montant négatif', async () => {
    const create = await request(app)
      .post('/api/comptes')
      .send({ titulaire: 'Orchelle', soldeInitial: 10000 });
    const id = create.body.id;
    const res = await request(app)
      .post(`/api/comptes/${id}/depot`)
      .send({ montant: -500 });
    expect(res.status).toBe(400);
    expect(res.body.erreur).toBe('Le montant du dépôt doit être supérieur à zéro.');
  });

  it('T4-04 : doit refuser un montant égal à zéro', async () => {
    const create = await request(app)
      .post('/api/comptes')
      .send({ titulaire: 'Orchelle', soldeInitial: 10000 });
    const id = create.body.id;
    const res = await request(app)
      .post(`/api/comptes/${id}/depot`)
      .send({ montant: 0 });
    expect(res.status).toBe(400);
  });
});

// ============================================================
// TESTS D'INTÉGRATION — Fonction 5 : Retrait
// ============================================================
describe('Fonction 5 — POST /api/comptes/:id/retrait — Retrait', () => {

  it('T5-01 : doit effectuer un retrait valide', async () => {
    const create = await request(app)
      .post('/api/comptes')
      .send({ titulaire: 'Orchelle', soldeInitial: 50000 });
    const id = create.body.id;
    const res = await request(app)
      .post(`/api/comptes/${id}/retrait`)
      .send({ montant: 20000 });
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Retrait effectué avec succès.');
    expect(res.body.nouveauSolde).toBe('30000 FCFA');
  });

  it('T5-02 : doit refuser si solde insuffisant', async () => {
    const create = await request(app)
      .post('/api/comptes')
      .send({ titulaire: 'Orchelle', soldeInitial: 1000 });
    const id = create.body.id;
    const res = await request(app)
      .post(`/api/comptes/${id}/retrait`)
      .send({ montant: 999999 });
    expect(res.status).toBe(400);
    expect(res.body.erreur).toBe('Solde insuffisant pour effectuer ce retrait.');
  });

  it('T5-03 : doit refuser un retrait sur compte inexistant', async () => {
    const res = await request(app)
      .post('/api/comptes/9999/retrait')
      .send({ montant: 5000 });
    expect(res.status).toBe(404);
  });

  it('T5-04 : doit refuser un montant négatif', async () => {
    const create = await request(app)
      .post('/api/comptes')
      .send({ titulaire: 'Orchelle', soldeInitial: 10000 });
    const id = create.body.id;
    const res = await request(app)
      .post(`/api/comptes/${id}/retrait`)
      .send({ montant: -1000 });
    expect(res.status).toBe(400);
  });

  it('T5-05 : doit accepter un retrait égal au solde exact', async () => {
    const create = await request(app)
      .post('/api/comptes')
      .send({ titulaire: 'Orchelle', soldeInitial: 5000 });
    const id = create.body.id;
    const res = await request(app)
      .post(`/api/comptes/${id}/retrait`)
      .send({ montant: 5000 });
    expect(res.status).toBe(200);
    expect(res.body.nouveauSolde).toBe('0 FCFA');
  });
});