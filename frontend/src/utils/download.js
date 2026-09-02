import api from '../api/client';

/**
 * Télécharge un fichier depuis un endpoint sécurisé par Bearer token.
 * Déclenche automatiquement le téléchargement du blob dans le navigateur.
 * 
 * @param {string} url Endpoint API (ex: '/reports/export/excel?type=journalier')
 * @param {string} nomFichierParDefaut Nom du fichier si non fourni dans Content-Disposition
 */
export async function telechargerFichier(url, nomFichierParDefaut = 'document.pdf') {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    });

    // Récupérer le nom de fichier depuis Content-Disposition s'il existe
    let nomFichier = nomFichierParDefaut;
    const disposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        nomFichier = match[1];
      }
    }

    // Créer un blob URL et simuler un clic pour déclencher le téléchargement
    const blob = new Blob([response.data], {
      type: response.headers['content-type'] || 'application/pdf',
    });
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', nomFichier);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (err) {
    console.error('Erreur lors du téléchargement :', err);
    if (err.response && err.response.data instanceof Blob) {
      try {
        const text = await err.response.data.text();
        const json = JSON.parse(text);
        if (json.error) {
          throw new Error(json.error);
        }
      } catch (parseErr) {
        if (parseErr.message && !parseErr.message.includes('JSON')) {
          throw parseErr;
        }
      }
    }
    const message = err?.response?.data?.error || err?.message || 'Impossible de télécharger le fichier.';
    throw new Error(message);
  }
}

export default telechargerFichier;
