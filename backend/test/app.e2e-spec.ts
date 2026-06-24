import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  afterEach(async () => {
    await app.close();
  });
});

/* 
Alles auf englisch bennen
UUIDS4
Artkelnummen kann keine Nummer sein und Artikelname trennen bei Produkt

Kategorie Tabelle name ohne umlaut und klein

Größe
Normal
8,00 EUR
XXL
11,00 EUR
Partyblech
28,00 EUR


Dressing
Joghurt-Dressing
Essig-Öl-Dressing
Kein Dressing



Aglio e Olio
mit Knoblauch, Chili, Petersilie und Olivenöl
close
Varianten
Spaghetti
Rigatoni
Tortellini
Tagliatelle




Aufpreise für zutaten bei verschiedenen Größen


  const handlePlzSave = async (neuePlz: string) => {
    if (!/^\d{5}$/.test(neuePlz)) {
      setPlzError('Bitte eine gültige 5-stellige PLZ eingeben.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/liefergebiet/check/${neuePlz}`);
      const data = await response.json();

      if (data.erlaubt) {
        setPlz(neuePlz);
        localStorage.setItem('milano_plz', neuePlz);
        setPlzError('');
        setIsPlzModalOpen(false);
      } else {
        setPlzError('Wir beliefern aktuell nur Leverkusen!');
      }
    } catch (error) {
      console.error('Fehler beim API-Aufruf:', error);
      setPlzError('Verbindung zum Server failed.');
    }
  };



Tailwind css

Ohne neuen tab drucken print css


Websockets später

Kommentare

Methoden black  kommentare 

Inline Kommentare innen.

Logging txt Datei  bei menu service ts



*/
