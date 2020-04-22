import fixture from '../../fixtures/v2/mainnet-valid-2.0.json';
import { BLOCKCHAINS, CERTIFICATE_VERSIONS, VERIFICATION_STATUSES } from '../../../src';
import Verifier from '../../../src/verifier';
import generateTransactionData, { TransactionData } from '../../../src/models/TransactionData';
import { defaultExplorers } from '../../../src/explorers';
import { explorerFactory } from '../../../src/explorers/explorer';
import { ExplorerAPI } from '../../../src/certificate';

describe('Verifier entity test suite', function () {
  let verifierInstance;
  const verifierParamFixture = {
    certificateJson: fixture,
    chain: BLOCKCHAINS.bitcoin,
    expires: '',
    id: fixture.id,
    issuer: fixture.badge.issuer,
    receipt: fixture.signature,
    revocationKey: null,
    transactionId: fixture.signature.anchors[0].sourceId,
    version: CERTIFICATE_VERSIONS.V2_0,
    explorerAPIs: null
  };

  describe('constructor method', function () {
    describe('given all parameters are passed', function () {
      const verifierInstance = new Verifier(verifierParamFixture);

      it('should set the chain to the verifier object', function () {
        expect(verifierInstance.chain).toEqual(verifierParamFixture.chain);
      });

      it('should set the expires to the verifier object', function () {
        expect(verifierInstance.expires).toBe(verifierParamFixture.expires);
      });

      it('should set the id to the verifier object', function () {
        expect(verifierInstance.id).toBe(verifierParamFixture.id);
      });

      it('should set the issuer to the verifier object', function () {
        expect(verifierInstance.issuer).toEqual(verifierParamFixture.issuer);
      });

      it('should set the receipt to the verifier object', function () {
        expect(verifierInstance.receipt).toBe(verifierParamFixture.receipt);
      });

      it('should set the revocationKey to the verifier object', function () {
        expect(verifierInstance.revocationKey).toBe(verifierParamFixture.revocationKey);
      });

      it('should set the version to the verifier object', function () {
        expect(verifierInstance.version).toBe(verifierParamFixture.version);
      });

      it('should set the transactionId to the verifier object', function () {
        expect(verifierInstance.transactionId).toBe(verifierParamFixture.transactionId);
      });

      describe('explorerAPIs', function () {
        describe('when it is undefined or null', function () {
          it('should set the explorerAPIs as an empty array to the verifier object', function () {
            expect(verifierInstance.explorerAPIs).toEqual([defaultExplorers]);
          });
        });

        describe('when it is a valid explorer API object', function () {
          it('should set the explorerAPIs to the verifier object', function () {
            const fixture = Object.assign({}, verifierParamFixture);
            const fixtureExplorerAPI: ExplorerAPI[] = [{
              serviceURL: 'https://explorer-example.com',
              priority: 0,
              parsingFunction: () => {
                return generateTransactionData('a','b', 'c', ['d']);
              }
            }];
            fixture.explorerAPIs = fixtureExplorerAPI;
            const expectedExplorers: any[] = [defaultExplorers];
            expectedExplorers.splice(0, 0, explorerFactory(fixtureExplorerAPI));
            const verifierInstance = new Verifier(fixture);
            // https://github.com/facebook/jest/issues/8475#issuecomment-537830532
            expect(JSON.stringify(verifierInstance.explorerAPIs)).toBe(JSON.stringify(expectedExplorers));
          });
        });
      });

      it('should set the documentToVerify to the verifier object', function () {
        const documentAssertion = JSON.parse(JSON.stringify(fixture));
        delete documentAssertion.signature;
        expect(verifierInstance.documentToVerify).toEqual(documentAssertion);
      });
    });
  });

  describe('setExplorerAPIs method', function () {
    let fixtureExplorerAPIs: ExplorerAPI[];

    beforeEach(function () {
      fixtureExplorerAPIs = [{
        serviceURL: 'https://explorer-example.com',
        priority: 0,
        parsingFunction: (jsonResponse, chain) => {
          return generateTransactionData('a','b', 'c', ['d']);
        }
      }]
      verifierInstance = new Verifier(verifierParamFixture);
    });

    describe('given no custom explorer API has been set', function () {
      beforeEach(function () {
        verifierInstance.setExplorerAPIs([]);
      });

      it('should only set the public APIs as explorer APIs', function () {
        expect(verifierInstance.explorerAPIs).toEqual([defaultExplorers]);
      });
    });

    describe('given a custom explorer API has been set', function () {
      describe('with priority set to 0', function () {
        it('should set the public & custom APIs in the right order', function () {
          verifierInstance.setExplorerAPIs(fixtureExplorerAPIs);
          expect(verifierInstance.explorerAPIs[1]).toEqual(defaultExplorers); // TODO: we should test on the values of the
          // array - currently when doing so we hit the `serializes to the same string` jest error (can't compare
          // functions)
        });
      });

      describe('with priority set to 1', function () {
        it('should set the public & custom APIs in the right order', function () {
          fixtureExplorerAPIs[0].priority = 1;
          verifierInstance.setExplorerAPIs(fixtureExplorerAPIs);
          expect(verifierInstance.explorerAPIs.length).toEqual(2); // TODO: we should test on the values of the
          // array - currently when doing so we hit the `serializes to the same string` jest error (can't compare
          // functions)
          expect(verifierInstance.explorerAPIs[0]).toEqual(defaultExplorers);
        });
      });
    });
  });

  describe('isFailing method', function () {
    beforeEach(function () {
      verifierInstance = new Verifier(verifierParamFixture);
    });

    describe('when all checks are successful', function () {
      it('should return false', function () {
        verifierInstance._stepsStatuses.push({ step: 'testStep 1', status: VERIFICATION_STATUSES.SUCCESS, action: 'Test Step 1' });
        verifierInstance._stepsStatuses.push({ step: 'testStep 2', status: VERIFICATION_STATUSES.SUCCESS, action: 'Test Step 2' });

        expect(verifierInstance._isFailing()).toBe(false);
      });
    });
    describe('when one check is failing', function () {
      it('should return true', function () {
        verifierInstance._stepsStatuses.push({ step: 'testStep 1', status: VERIFICATION_STATUSES.SUCCESS, action: 'Test Step 1' });
        verifierInstance._stepsStatuses.push({ step: 'testStep 2', status: VERIFICATION_STATUSES.FAILURE, action: 'Test Step 2' });

        expect(verifierInstance._isFailing()).toBe(true);
      });
    });
  });
});
