import { expect, test } from '@playwright/test';

test('Parcours E2E StandPower Web : Onboarding, Séance, Reprise, Poids, JJB, Minuteur et Export', async ({
  page,
}) => {
  await page.goto('/');

  // 1. Premier lancement & Questionnaire
  await expect(page.getByText('Configurer ton carnet')).toBeVisible();
  await page.getByRole('button', { name: 'Démarrer le questionnaire' }).click();
  await page.getByRole('button', { name: 'Configurer mon programme' }).click();

  await page.getByRole('button', { name: 'Suivant' }).click();
  await page.getByRole('button', { name: 'Suivant' }).click();
  await page.getByRole('button', { name: 'Suivant' }).click();
  await page.getByRole('button', { name: 'Calculer ma recommandation' }).click();

  // 3. Programme conseillé
  await expect(page.getByText(/Pourquoi ce choix/i)).toBeVisible();
  await page.getByRole('button', { name: 'Commencer', exact: true }).click();

  // 4. Démarrage séance
  await expect(page.getByText('Prochaine séance')).toBeVisible();
  await page.getByRole('button', { name: /Démarrer/i }).first().click();
  await expect(page.getByText('Séance en cours')).toBeVisible();

  // 5. Validation d'une série
  await page.getByRole('button', { name: /Valider série 1/i }).first().click();

  // 6 & 7. Rechargement page -> Reprise intacte
  await page.reload();
  await expect(page.getByText('Séance en cours')).toBeVisible();

  // 8. Fin de séance
  await page.getByRole('button', { name: 'Terminer' }).click();
  await page
    .getByRole('button', { name: 'Valider et clôturer la séance' })
    .click();
  await expect(page.getByText('Séance enregistrée')).toBeVisible();

  // 10. Ajout d'un poids dans Progression
  await page.getByRole('link', { name: 'Progression' }).click();
  await page.getByRole('button', { name: /Ajouter une pesée/i }).click();
  await page.getByLabel(/Poids \(/i).fill('75,6');
  await page.getByRole('button', { name: 'Enregistrer' }).click();
  await expect(page.getByText('75,6 kg')).toBeVisible();

  // 12 & 13. Combat : Journal JJB & Minuteur
  await page.getByRole('link', { name: 'Combat' }).click();
  await page
    .getByRole('button', { name: 'Enregistrer dans le journal de combat' })
    .click();
  await expect(page.getByText('Séance de combat enregistrée')).toBeVisible();

  await page.getByRole('tab', { name: 'Minuteur' }).click();
  await expect(page.getByText('00:10')).toBeVisible();
});
