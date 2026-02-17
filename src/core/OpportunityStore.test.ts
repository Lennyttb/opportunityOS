import * as fs from 'fs/promises';
import { OpportunityStore } from './OpportunityStore';
import { Opportunity, OpportunityStatus, OpportunityType } from '../types';
import { Logger } from '../utils/Logger';

jest.mock('fs/promises');
jest.mock('../utils/Logger');

describe('OpportunityStore', () => {
  const testFilePath = './test-data/opportunities.json';
  let store: OpportunityStore;

  const mockOpportunity: Opportunity = {
    id: 'opp-123',
    type: OpportunityType.FUNNEL_DROP,
    status: OpportunityStatus.DETECTED,
    score: 85,
    title: 'Test Opportunity',
    description: 'Test description',
    evidence: {
      dataSource: 'userpilot',
      rawData: {} as any,
      metrics: { dropoffRate: 0.45 },
      insights: ['High dropoff at step 2'],
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    Logger.getInstance = jest.fn().mockReturnValue({
      child: jest.fn().mockReturnValue({
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      }),
    });

    store = new OpportunityStore(testFilePath);
  });

  describe('initialize', () => {
    it('should create directory if it does not exist', async () => {
      (fs.access as jest.Mock).mockRejectedValueOnce({ code: 'ENOENT' });
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockRejectedValue({ code: 'ENOENT' });

      await store.initialize();

      expect(fs.mkdir).toHaveBeenCalledWith('./test-data', { recursive: true });
    });

    it('should load existing opportunities from file', async () => {
      const existingData = [mockOpportunity];
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(existingData));

      await store.initialize();

      const loaded = store.get('opp-123');
      expect(loaded).toEqual(mockOpportunity);
    });

    it('should start with empty store if file does not exist', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockRejectedValue({ code: 'ENOENT' });

      await store.initialize();

      expect(store.getAll()).toEqual([]);
    });

    it('should only initialize once', async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockRejectedValue({ code: 'ENOENT' });

      await store.initialize();
      await store.initialize();

      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should throw error if file contains invalid data', async () => {
      const invalidData = [{ ...mockOpportunity, score: 150 }]; // Invalid score
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(invalidData));

      await expect(store.initialize()).rejects.toThrow(
        'Invalid opportunity: score must be between 0 and 100'
      );
    });
  });

  describe('create', () => {
    beforeEach(async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockRejectedValue({ code: 'ENOENT' });
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      await store.initialize();
    });

    it('should create a new opportunity', async () => {
      await store.create(mockOpportunity);

      const created = store.get('opp-123');
      expect(created).toEqual(mockOpportunity);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should throw error if opportunity already exists', async () => {
      await store.create(mockOpportunity);

      await expect(store.create(mockOpportunity)).rejects.toThrow(
        'Opportunity with id opp-123 already exists'
      );
    });

    it('should validate opportunity before creating', async () => {
      const invalidOpp = { ...mockOpportunity, score: -10 };

      await expect(store.create(invalidOpp)).rejects.toThrow(
        'Invalid opportunity: score must be between 0 and 100'
      );
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockRejectedValue({ code: 'ENOENT' });
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      await store.initialize();
      await store.create(mockOpportunity);
    });

    it('should update an existing opportunity', async () => {
      const updated = await store.update('opp-123', {
        status: OpportunityStatus.PROMOTED,
        score: 90,
      });

      expect(updated.status).toBe(OpportunityStatus.PROMOTED);
      expect(updated.score).toBe(90);
      expect(updated.updatedAt).not.toBe(mockOpportunity.updatedAt);
    });

    it('should throw error if opportunity does not exist', async () => {
      await expect(
        store.update('non-existent', { status: OpportunityStatus.PROMOTED })
      ).rejects.toThrow('Opportunity with id non-existent not found');
    });

    it('should not allow changing id', async () => {
      const updated = await store.update('opp-123', { id: 'new-id' } as any);

      expect(updated.id).toBe('opp-123');
    });

    it('should validate updated opportunity', async () => {
      await expect(store.update('opp-123', { score: 150 })).rejects.toThrow(
        'Invalid opportunity: score must be between 0 and 100'
      );
    });
  });

  describe('get and getAll', () => {
    beforeEach(async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockRejectedValue({ code: 'ENOENT' });
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      await store.initialize();
    });

    it('should get opportunity by id', async () => {
      await store.create(mockOpportunity);

      const found = store.get('opp-123');
      expect(found).toEqual(mockOpportunity);
    });

    it('should return undefined for non-existent id', () => {
      const found = store.get('non-existent');
      expect(found).toBeUndefined();
    });

    it('should get all opportunities', async () => {
      await store.create(mockOpportunity);
      await store.create({ ...mockOpportunity, id: 'opp-456' });

      const all = store.getAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('getByStatus', () => {
    beforeEach(async () => {
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readFile as jest.Mock).mockRejectedValue({ code: 'ENOENT' });
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
      await store.initialize();
    });

    it('should filter opportunities by status', async () => {
      await store.create(mockOpportunity);
      await store.create({
        ...mockOpportunity,
        id: 'opp-456',
        status: OpportunityStatus.PROMOTED,
      });

      const detected = store.getByStatus(OpportunityStatus.DETECTED);
      const promoted = store.getByStatus(OpportunityStatus.PROMOTED);

      expect(detected).toHaveLength(1);
      expect(promoted).toHaveLength(1);
      expect(detected[0].id).toBe('opp-123');
      expect(promoted[0].id).toBe('opp-456');
    });
  });
});

