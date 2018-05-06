DROP TABLE IF EXISTS policy_models;
DROP TABLE IF EXISTS assessments;
DROP TABLE IF EXISTS key_value_store;
DROP TABLE IF EXISTS version;

CREATE TABLE policy_models
(
    id TEXT NOT NULL, 
    version INTEGER NOT NULL,
    data BLOB NOT NULL,
    is_data_connected INTEGER NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE assessments
(
    id TEXT NOT NULL,
    description TEXT NOT NULL,
    policy_model_id TEXT NOT NULL,
    interview_snapshot BLOB,
    interview_last_modified INTEGER NOT NULL,
    status INTEGER NOT NULL,
    
    seed_data TEXT,
    submit_data TEXT,
    data_connection_context TEXT,
    
    PRIMARY KEY (id, policy_model_id)
);

CREATE TABLE key_value_store
(
    key_name TEXT NOT NULL,
    value TEXT,
    PRIMARY KEY (key_name)
);

CREATE TABLE version
(
    major INTEGER NOT NULL,
    minor INTEGER NOT NULL,
    patch INTEGER NOT NULL,
    build INTEGER NOT NULL
);