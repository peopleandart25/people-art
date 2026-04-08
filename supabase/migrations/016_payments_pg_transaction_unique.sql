-- payments.pg_transaction_id UNIQUE 제약 추가 (중복 결제 방지)
ALTER TABLE payments ADD CONSTRAINT payments_pg_transaction_id_unique UNIQUE (pg_transaction_id);
