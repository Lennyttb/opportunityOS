import * as fs from 'fs/promises';
import * as path from 'path';
import { Opportunity, OpportunityStatus } from '../types';
import { Logger } from '../utils/Logger';

/**
 * OpportunityStore manages persistence of opportunities to JSON file
 */
export class OpportunityStore {
  private filePath: string;
  private logger: Logger;
  private opportunities: Map<string, Opportunity>;
  private initialized: boolean = false;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.logger = Logger.getInstance().child('OpportunityStore');
    this.opportunities = new Map();
  }

  /**
   * Initialize the store by loading existing data
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      await this.ensureDirectoryExists();
      await this.load();
      this.initialized = true;
      this.logger.info('OpportunityStore initialized', {
        filePath: this.filePath,
        count: this.opportunities.size,
      });
    } catch (error) {
      this.logger.error('Failed to initialize OpportunityStore', error as Error);
      throw error;
    }
  }

  /**
   * Ensure the directory for the data file exists
   */
  private async ensureDirectoryExists(): Promise<void> {
    const dir = path.dirname(this.filePath);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
      this.logger.debug('Created directory', { dir });
    }
  }

  /**
   * Load opportunities from file
   */
  private async load(): Promise<void> {
    try {
      await fs.access(this.filePath);
      const data = await fs.readFile(this.filePath, 'utf-8');

      // Handle empty file
      if (!data || data.trim() === '') {
        this.logger.debug('Empty data file found, starting fresh');
        this.opportunities.clear();
        return;
      }

      const opportunities: Opportunity[] = JSON.parse(data);

      this.opportunities.clear();
      for (const opp of opportunities) {
        this.validateOpportunity(opp);
        this.opportunities.set(opp.id, opp);
      }

      this.logger.debug('Loaded opportunities from file', {
        count: opportunities.length,
      });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.logger.debug('No existing data file found, starting fresh');
        this.opportunities.clear();
      } else if (error instanceof SyntaxError) {
        this.logger.warn('Corrupted data file, starting fresh', {
          error: error.message,
        });
        this.opportunities.clear();
      } else {
        throw error;
      }
    }
  }

  /**
   * Save opportunities to file
   */
  private async save(): Promise<void> {
    const opportunities = Array.from(this.opportunities.values());
    const data = JSON.stringify(opportunities, null, 2);
    await fs.writeFile(this.filePath, data, 'utf-8');
    this.logger.debug('Saved opportunities to file', { count: opportunities.length });
  }

  /**
   * Validate opportunity structure
   */
  private validateOpportunity(opp: Opportunity): void {
    if (!opp.id || typeof opp.id !== 'string') {
      throw new Error('Invalid opportunity: missing or invalid id');
    }
    if (!opp.type || !Object.values(OpportunityStatus).includes(opp.status as any)) {
      throw new Error(`Invalid opportunity: invalid status ${opp.status}`);
    }
    if (typeof opp.score !== 'number' || opp.score < 0 || opp.score > 100) {
      throw new Error('Invalid opportunity: score must be between 0 and 100');
    }
  }

  /**
   * Create a new opportunity
   */
  public async create(opportunity: Opportunity): Promise<void> {
    this.validateOpportunity(opportunity);

    if (this.opportunities.has(opportunity.id)) {
      throw new Error(`Opportunity with id ${opportunity.id} already exists`);
    }

    this.opportunities.set(opportunity.id, opportunity);
    await this.save();

    this.logger.info('Created opportunity', {
      id: opportunity.id,
      type: opportunity.type,
      score: opportunity.score,
    });
  }

  /**
   * Update an existing opportunity
   */
  public async update(id: string, updates: Partial<Opportunity>): Promise<Opportunity> {
    const existing = this.opportunities.get(id);
    if (!existing) {
      throw new Error(`Opportunity with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      id, // Ensure id cannot be changed
      updatedAt: new Date().toISOString(),
    };

    this.validateOpportunity(updated);
    this.opportunities.set(id, updated);
    await this.save();

    this.logger.info('Updated opportunity', { id, updates: Object.keys(updates) });
    return updated;
  }

  /**
   * Get an opportunity by id
   */
  public get(id: string): Opportunity | undefined {
    return this.opportunities.get(id);
  }

  /**
   * Get all opportunities
   */
  public getAll(): Opportunity[] {
    return Array.from(this.opportunities.values());
  }

  /**
   * Get opportunities by status
   */
  public getByStatus(status: OpportunityStatus): Opportunity[] {
    return this.getAll().filter((opp) => opp.status === status);
  }
}

