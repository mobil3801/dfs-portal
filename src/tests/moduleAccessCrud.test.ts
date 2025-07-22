import { supabaseAdapter } from '@/services/supabase/supabaseAdapter';
import { describe, test, expect } from '@jest/globals';

const MODULE_ACCESS_TABLE_ID = 25712;

describe('Module Access CRUD Operations', () => {
  let createdRecordId: string;

  test('Create a module_access record with create_enabled field', async () => {
    const data = {
      user_id: '00000000-0000-0000-0000-000000000000', // Replace with valid UUID
      module_name: 'test_module',
      create_enabled: true,
      is_active: true,
    };
    const result = await supabaseAdapter.tableCreate(MODULE_ACCESS_TABLE_ID, data);
    expect(result.error).toBeNull();
  });

  test('Read module_access records and verify create_enabled field', async () => {
    const params = {
      Filters: [{ name: 'module_name', op: 'Equal', value: 'test_module' }],
      PageNo: 1,
      PageSize: 10,
    };
    const result = await supabaseAdapter.tablePage(MODULE_ACCESS_TABLE_ID, params);
    expect(result.error).toBeNull();
    expect(result.data.List.length).toBeGreaterThan(0);
    const record = result.data.List.find((r: any) => r.module_name === 'test_module');
    expect(record).toBeDefined();
    expect(record.create_enabled).toBe(true);
    createdRecordId = record.id;
  });

  test('Update create_enabled field of module_access record', async () => {
    const data = {
      id: createdRecordId,
      create_enabled: false,
    };
    const result = await supabaseAdapter.tableUpdate(MODULE_ACCESS_TABLE_ID, data);
    expect(result.error).toBeNull();

    // Verify update
    const params = {
      Filters: [{ name: 'id', op: 'Equal', value: createdRecordId }],
      PageNo: 1,
      PageSize: 1,
    };
    const readResult = await supabaseAdapter.tablePage(MODULE_ACCESS_TABLE_ID, params);
    expect(readResult.error).toBeNull();
    expect(readResult.data.List[0].create_enabled).toBe(false);
  });

  test('Delete module_access record', async () => {
    const data = { id: createdRecordId };
    const result = await supabaseAdapter.tableDelete(MODULE_ACCESS_TABLE_ID, data);
    expect(result.error).toBeNull();

    // Verify deletion
    const params = {
      Filters: [{ name: 'id', op: 'Equal', value: createdRecordId }],
      PageNo: 1,
      PageSize: 1,
    };
    const readResult = await supabaseAdapter.tablePage(MODULE_ACCESS_TABLE_ID, params);
    expect(readResult.error).toBeNull();
    expect(readResult.data.List.length).toBe(0);
  });

  // Edge case tests
  test('Create record with missing required fields', async () => {
    const data = {
      module_name: 'missing_user_id',
      create_enabled: true,
    };
    const result = await supabaseAdapter.tableCreate(MODULE_ACCESS_TABLE_ID, data);
    expect(result.error).not.toBeNull();
  });

  test('Create record with invalid data type for create_enabled', async () => {
    const data = {
      user_id: '00000000-0000-0000-0000-000000000000', // Replace with valid UUID
      module_name: 'invalid_create_enabled',
      create_enabled: 'not_a_boolean',
    };
    const result = await supabaseAdapter.tableCreate(MODULE_ACCESS_TABLE_ID, data);
    expect(result.error).not.toBeNull();
  });
});
