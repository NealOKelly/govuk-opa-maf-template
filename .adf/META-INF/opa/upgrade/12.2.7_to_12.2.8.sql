DROP TABLE unapplied_rulebase_updates;
CREATE TABLE new_policy_models(id TEXT NOT NULL, version INTEGER NOT NULL, data BLOB NOT NULL, is_data_connected INTEGER NOT NULL, PRIMARY KEY (id) );
INSERT INTO new_policy_models(id, version, data, is_data_connected) SELECT name, version, zip, 0 FROM policy_models;
DROP TABLE policy_models;
ALTER TABLE new_policy_models RENAME TO policy_models;
CREATE TABLE new_key_value_store(key_name TEXT NOT NULL, value TEXT, PRIMARY KEY (key_name));
INSERT INTO new_key_value_store(key_name, value) SELECT key_name, value FROM key_value_store;
DROP TABLE key_value_store;
ALTER TABLE new_key_value_store RENAME TO key_value_store;
CREATE TABLE assessments(id TEXT NOT NULL, description TEXT NOT NULL, policy_model_id TEXT NOT NULL, interview_snapshot BLOB, interview_last_modified INTEGER NOT NULL, status INTEGER NOT NULL, seed_data TEXT, submit_data TEXT, data_connection_context TEXT, PRIMARY KEY (id, policy_model_id));
INSERT INTO assessments(id, description, policy_model_id, interview_snapshot, interview_last_modified, status, seed_data, submit_data, data_connection_context) SELECT rowid, name, rulebase_name, snapshot, modified, 2, null, null, null FROM saved_sessions;
UPDATE assessments SET description = "Unnamed " || policy_model_id WHERE description = "~~DEFAULT~~";
DROP TABLE saved_sessions;