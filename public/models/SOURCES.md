# Modelli Bacarodex

Solo BlazeFace (detector), FaceMesh (allineamento) e MobileFace (embedding).
BlazeFace/FaceMesh copiati dal pacchetto ufficiale @vladmandic/human 3.3.6 (MIT).
MobileFace dal repository ufficiale vladmandic/human-models, revisione
bc66dc53bac03c96d35a7e6daaf717e72f3985f5 (MIT).
Licenze preservate in LICENSE-human.txt e LICENSE-models.txt.

Fonti e crediti originali:
- https://github.com/vladmandic/human/wiki/Models
- https://github.com/vladmandic/human-models
- https://github.com/google/mediapipe (BlazeFace e FaceMesh, Apache-2.0)
- https://github.com/becauseofAI/MobileFace (MobileFace)

Lo script npm run models verifica SHA-256 e tutti gli shard nei manifest.
FaceRes non incluso: stima anche età/genere. MobileFace estrae solo embedding.
