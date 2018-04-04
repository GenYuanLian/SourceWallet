import { Logger } from '../../providers/logger/logger';
import { PlatformProvider } from '../platform/platform';
import { File } from '@ionic-native/file';
import { PersistenceProvider } from './persistence';

class FileMock extends File {}

describe('Persistence Provider', () => {
  let persistenceProvider: PersistenceProvider;
  let logs: any[];

  const loggerMock = {
    info: info => {
      logs.push(info);
    }
  } as Logger;
  const platformMock = {} as PlatformProvider;
  const fileMock = new FileMock();

  beforeEach(() => {
    logs = [];
  });

  function createAndLoad() {
    persistenceProvider = new PersistenceProvider(
      loggerMock,
      platformMock,
      fileMock
    );
    persistenceProvider.load();
  }

  describe('When platform is Cordova', () => {
    beforeEach(() => {
      platformMock.isCordova = true;
      createAndLoad();
    });
    it('should use the FileStorage provider', () => {
      expect(persistenceProvider.storage.constructor.name).toBe('FileStorage');
    });
  });
  describe('When platform is not Cordova', () => {
    beforeEach(() => {
      platformMock.isCordova = false;
      createAndLoad();
    });
    it('should use the LocalStorage provider', () => {
      expect(persistenceProvider.storage.constructor.name).toBe('LocalStorage');
    });
    it('should correctly perform a profile roundtrip', done => {
      let p = { name: 'My profile' };
      persistenceProvider
        .storeNewProfile(p)
        .catch(err => expect(err).toBeNull)
        .then(() => {
          return persistenceProvider.getProfile();
        })
        .then(profile => {
          expect(typeof profile).toEqual('object');
          expect(profile.name).toEqual('My profile');
        })
        .then(done);
    });

    it('should fail to create a profile when one already exists', () => {
      let p = { name: 'My profile' };
      persistenceProvider
        .storeNewProfile(p)
        .then(() => {
          return persistenceProvider.storeNewProfile(p);
        })
        .catch(err => {
          expect(err.message).toEqual('Key already exists');
        });
    });
  });
});
