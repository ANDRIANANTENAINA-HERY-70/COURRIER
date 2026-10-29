import { useState } from 'react'

const SanctionProgression = () => {
  const [activeTab, setActiveTab] = useState('progression')

  return (
    <div className="sanction-progression">
      <h1>Sanctions progressives et plan de retour</h1>
      
      <div className="progression-tabs">
        <button 
          className={`tab ${activeTab === 'progression' ? 'active' : ''}`}
          onClick={() => setActiveTab('progression')}
        >
          Échelle de sanctions
        </button>
        <button 
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Plans en cours
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Historique
        </button>
      </div>

      <div className="progression-content">
        {activeTab === 'progression' && (
          <div className="progression-section">
            <h2>Échelle de sanctions progressives</h2>
            <div className="progression-explanation">
              <div className="explanation-card">
                <h3>⚖️ Pourquoi c'est crucial</h3>
                <p>C'est juste, prévisible et dissuasif. L'employé sait exactement à quoi s'attendre.</p>
                <ul>
                  <li>Transparence totale du processus</li>
                  <li>Équité de traitement pour tous</li>
                  <li>Progressivité adaptée</li>
                  <li>Opportunités de correction</li>
                </ul>
              </div>
            </div>

            <div className="sanctions-ladder">
              <h3>Échelle des sanctions automatiques</h3>
              <div className="ladder-steps">
                <div className="step-card first">
                  <div className="step-header">
                    <h4>1er retard</h4>
                    <span className="level-badge">Niveau 1</span>
                  </div>
                  <div className="step-content">
                    <div className="sanction-details">
                      <p><strong>Action:</strong> Rappel à l'oral</p>
                      <p><strong>Responsable:</strong> Manager direct</p>
                      <p><strong>Délai:</strong> Immédiat</p>
                      <p><strong>Impact:</strong> -1 point assiduité</p>
                    </div>
                    <div className="sanction-process">
                      <h5>Processus automatique:</h5>
                      <ol>
                        <li>Détection du retard (&gt;5 min)</li>
                        <li>Notification manager</li>
                        <li>Rappel verbal lors de l'arrivée</li>
                        <li>Enregistrement automatique</li>
                      </ol>
                    </div>
                    <div className="next-step">
                      <p><strong>Prochaine étape si récidive:</strong> 2e retard dans le mois</p>
                    </div>
                  </div>
                </div>

                <div className="step-card second">
                  <div className="step-header">
                    <h4>2e retard</h4>
                    <span className="level-badge">Niveau 2</span>
                  </div>
                  <div className="step-content">
                    <div className="sanction-details">
                      <p><strong>Action:</strong> Avertissement écrit</p>
                      <p><strong>Responsable:</strong> Manager + RH</p>
                      <p><strong>Délai:</strong> 24h</p>
                      <p><strong>Impact:</strong> -3 points assiduité</p>
                    </div>
                    <div className="sanction-process">
                      <h5>Processus automatique:</h5>
                      <ol>
                        <li>Détection 2e retard dans le mois</li>
                        <li>Génération document d'avertissement</li>
                        <li>Email à l'employé et manager</li>
                        <li>Signed électroniquement requis</li>
                      </ol>
                    </div>
                    <div className="next-step">
                      <p><strong>Prochaine étape si récidive:</strong> 3e retard dans le mois</p>
                    </div>
                  </div>
                </div>

                <div className="step-card third">
                  <div className="step-header">
                    <h4>3e retard</h4>
                    <span className="level-badge">Niveau 3</span>
                  </div>
                  <div className="step-content">
                    <div className="sanction-details">
                      <p><strong>Action:</strong> Entretien formel + plan d'amélioration</p>
                      <p><strong>Responsable:</strong> Manager + RH + Direction</p>
                      <p><strong>Délai:</strong> 48h</p>
                      <p><strong>Impact:</strong> -5 points assiduité</p>
                    </div>
                    <div className="sanction-process">
                      <h5>Processus automatique:</h5>
                      <ol>
                        <li>Détection 3e retard dans le mois</li>
                        <li>Convocation automatique entretien</li>
                        <li>Génération plan d'amélioration</li>
                        <li>Suivi hebdomadaire mis en place</li>
                      </ol>
                    </div>
                    <div className="plan-details">
                      <h5>Plan d'amélioration obligatoire:</h5>
                      <ul>
                        <li>Pointage 15 min en avance pendant 1 mois</li>
                        <li>Notification manager quotidienne</li>
                        <li>Rapport hebdomadaire RH</li>
                        <li>Objectif: 0 retard pendant 30 jours</li>
                      </ul>
                    </div>
                    <div className="next-step">
                      <p><strong>Prochaine étape si échec:</strong> Non-respect plan d'amélioration</p>
                    </div>
                  </div>
                </div>

                <div className="step-card fourth">
                  <div className="step-header">
                    <h4>4e retard / Non-respect plan</h4>
                    <span className="level-badge">Niveau 4</span>
                  </div>
                  <div className="step-content">
                    <div className="sanction-details">
                      <p><strong>Action:</strong> Sanction (gel de prime, etc.)</p>
                      <p><strong>Responsable:</strong> Direction RH</p>
                      <p><strong>Délai:</strong> 72h</p>
                      <p><strong>Impact:</strong> -10 points + gel prime</p>
                    </div>
                    <div className="sanction-process">
                      <h5>Processus automatique:</h5>
                      <ol>
                        <li>Détection non-respect plan ou 4e retard</li>
                        <li>Alerte niveau direction</li>
                        <li>Convocation entretien final</li>
                        <li>Décision sanction automatique</li>
                      </ol>
                    </div>
                    <div className="sanction-types">
                      <h5>Types de sanctions possibles:</h5>
                      <ul>
                        <li>Gel prime annuelle (25-50%)</li>
                        <li>Suspension promotion (6-12 mois)</li>
                        <li>Rétrogradation temporaire</li>
                        <li>Procédure disciplinaire complète</li>
                      </ul>
                    </div>
                    <div className="next-step">
                      <p><strong>Prochaine étape si récidive:</strong> Procédure de licenciement</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="special-cases">
              <h3>Cas spéciaux et sanctions adaptées</h3>
              <div className="special-grid">
                <div className="special-card">
                  <h4>🚨 Absences non justifiées</h4>
                  <div className="special-rules">
                    <p><strong>1ère absence:</strong> Avertissement écrit + -5 points</p>
                    <p><strong>2ème absence:</strong> Gel prime 25% + -8 points</p>
                    <p><strong>3ème absence:</strong> Gel prime 50% + procédure disciplinaire</p>
                    <p><strong>4ème absence:</strong> Suspension temporaire</p>
                  </div>
                </div>

                <div className="special-card">
                  <h4>⚠️ Retards excessifs (&gt;30 min)</h4>
                  <div className="special-rules">
                    <p><strong>1er incident:</strong> Avertissement écrit immédiat</p>
                    <p><strong>2ème incident:</strong> Entretien formel</p>
                    <p><strong>3ème incident:</strong> Sanction financière</p>
                    <p><strong>Récidive:</strong> Procédure disciplinaire</p>
                  </div>
                </div>

                <div className="special-card">
                  <h4>📄 Faux justificatifs</h4>
                  <div className="special-rules">
                    <p><strong>Détection:</strong> Sanction immédiate niveau 4</p>
                    <p><strong>Conséquence:</strong> -15 points + warning</p>
                    <p><strong>Suivi:</strong> Procédure disciplinaire obligatoire</p>
                    <p><strong>Récidive:</strong> Licenciement pour faute</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'active' && (
          <div className="active-section">
            <h2>Plans d'amélioration actifs</h2>
            <div className="active-plans">
              <div className="plan-card active">
                <div className="plan-header">
                  <h3>📋 Plan d'amélioration - Lucas Dubois</h3>
                  <span className="status-badge active">Actif</span>
                </div>
                <div className="plan-details">
                  <div className="plan-info">
                    <p><strong>Niveau:</strong> Niveau 3 (3e retard)</p>
                    <p><strong>Début:</strong> 28/11/2024</p>
                    <p><strong>Durée:</strong> 30 jours</p>
                    <p><strong>Responsable:</strong> Thomas Bernard (Manager)</p>
                  </div>
                  
                  <div className="plan-objectives">
                    <h4>Objectifs du plan:</h4>
                    <ul>
                      <li>✅ Pointage 15 min en avance chaque jour</li>
                      <li>✅ Notification manager quotidienne confirmée</li>
                      <li>⏳ 0 retard pendant 30 jours (en cours: 7 jours)</li>
                      <li>⏳ Rapport hebdomadaire RH (prochain: 12/12)</li>
                    </ul>
                  </div>

                  <div className="plan-progress">
                    <h4>Progression:</h4>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: '23%'}}></div>
                      <span>23% (7/30 jours)</span>
                    </div>
                    <div className="progress-details">
                      <p><strong>Jours respectés:</strong> 7/7</p>
                      <p><strong>Retards:</strong> 0</p>
                      <p><strong>Score actuel:</strong> 52/100 (+7 points)</p>
                    </div>
                  </div>

                  <div className="plan-actions">
                    <h4>Actions récentes:</h4>
                    <div className="action-timeline">
                      <div className="action-item">
                        <span className="date">05/12</span>
                        <span className="action">Pointage 08:45 (objectif respecté)</span>
                      </div>
                      <div className="action-item">
                        <span className="date">04/12</span>
                        <span className="action">Pointage 08:30 (objectif respecté)</span>
                      </div>
                      <div className="action-item">
                        <span className="date">03/12</span>
                        <span className="action">Notification manager envoyée</span>
                      </div>
                    </div>
                  </div>

                  <div className="plan-next-steps">
                    <h4>Prochaines étapes:</h4>
                    <ul>
                      <li>Continuer respect horaire jusqu'au 28/12</li>
                      <li>Rapport RH le 12/12</li>
                      <li>Évaluation finale le 28/12</li>
                      <li>Succès = Retour niveau normal</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="plan-card warning">
                <div className="plan-header">
                  <h3>⚠️ Suivi rapproché - Thomas Bernard</h3>
                  <span className="status-badge warning">Surveillance</span>
                </div>
                <div className="plan-details">
                  <div className="plan-info">
                    <p><strong>Niveau:</strong> Pré-niveau 2 (2 retards)</p>
                    <p><strong>Début:</strong> 04/12/2024</p>
                    <p><strong>Durée:</strong> 14 jours</p>
                    <p><strong>Responsable:</strong> Sophie Martin (Senior)</p>
                  </div>
                  
                  <div className="plan-objectives">
                    <h4>Objectifs de suivi:</h4>
                    <ul>
                      <li>✅ Pas de retard pendant 14 jours</li>
                      <li>✅ Notification si prévu retard</li>
                      <li>⏳ 3 jours restants</li>
                    </ul>
                  </div>

                  <div className="plan-progress">
                    <h4>Progression:</h4>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: '79%'}}></div>
                      <span>79% (11/14 jours)</span>
                    </div>
                  </div>

                  <div className="plan-outcome">
                    <h4>Succès probable:</h4>
                    <p>Si objectif respecté → Retour niveau normal</p>
                    <p>Si échec → Passage niveau 2 automatique</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-section">
            <h2>Historique des sanctions et plans</h2>
            <div className="history-filters">
              <div className="filter-group">
                <label>Période:</label>
                <select>
                  <option>Derniers 3 mois</option>
                  <option>Derniers 6 mois</option>
                  <option>Dernière année</option>
                  <option>Tout l'historique</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Type:</label>
                <select>
                  <option>Tous types</option>
                  <option>Sanctions</option>
                  <span className="status-badge active">Plans d'amélioration</span>
                  <option>Avertissements</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Statut:</label>
                <select>
                  <option>Tous</option>
                  <option>Actifs</option>
                  <option>Terminés avec succès</option>
                  <option>Terminés avec échec</option>
                </select>
              </div>
            </div>

            <div className="history-table">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Employé</th>
                    <th>Type</th>
                    <th>Niveau</th>
                    <th>Raison</th>
                    <th>Durée</th>
                    <th>Résultat</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>28/11/2024</td>
                    <td>Lucas Dubois</td>
                    <td>Plan d'amélioration</td>
                    <td>Niveau 3</td>
                    <td>3e retard mois</td>
                    <td>30 jours</td>
                    <td><span className="status-badge active">🔄 En cours</span></td>
                    <td>
                      <button className="action-btn">Voir</button>
                    </td>
                  </tr>
                  <tr>
                    <td>15/11/2024</td>
                    <td>Pierre Durand</td>
                    <td>Plan d'amélioration</td>
                    <td>Niveau 2</td>
                    <td>2e retard mois</td>
                    <td>14 jours</td>
                    <td><span className="status-badge success">✅ Succès</span></td>
                    <td>
                      <button className="action-btn">Voir</button>
                    </td>
                  </tr>
                  <tr>
                    <td>10/11/2024</td>
                    <td>Marie Laurent</td>
                    <td>Sanction</td>
                    <td>Niveau 4</td>
                    <td>Non-respect plan</td>
                    <td>-</td>
                    <td><span className="status-badge warning">⚠️ Gel prime</span></td>
                    <td>
                      <button className="action-btn">Voir</button>
                    </td>
                  </tr>
                  <tr>
                    <td>05/11/2024</td>
                    <td>Antoine Robert</td>
                    <td>Avertissement</td>
                    <td>Niveau 2</td>
                    <td>2e retard</td>
                    <td>-</td>
                    <td><span className="status-badge completed">📋 Terminé</span></td>
                    <td>
                      <button className="action-btn">Voir</button>
                    </td>
                  </tr>
                  <tr>
                    <td>01/11/2024</td>
                    <td>Claire Petit</td>
                    <td>Rappel oral</td>
                    <td>Niveau 1</td>
                    <td>1er retard</td>
                    <td>-</td>
                    <td><span className="status-badge completed">📋 Terminé</span></td>
                    <td>
                      <button className="action-btn">Voir</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="statistics">
              <h3>Statistiques des sanctions</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <h4>Taux de succès plans</h4>
                  <div className="stat-value">78%</div>
                  <p>Des plans d'amélioration réussis</p>
                </div>
                <div className="stat-card">
                  <h4>Récidive 30 jours</h4>
                  <div className="stat-value">12%</div>
                  <p>Des employés sanctionnés récidivent</p>
                </div>
                <div className="stat-card">
                  <h4>Sanctions niveau 4</h4>
                  <div className="stat-value">3</div>
                  <p>Cette année (en baisse de 40%)</p>
                </div>
                <div className="stat-card">
                  <h4>Impact global</h4>
                  <div className="stat-value positive">-65%</div>
                  <p>Retards depuis mise en place</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SanctionProgression
