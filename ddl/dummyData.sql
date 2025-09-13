-- Insert dummy users
insert into users (id, email, name, password_hash)
values
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', 'test@example.com', 'Test User', 'password123');

insert into weight (user_id, measured_at, weight, unit)
values 
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', '2025-09-07', 182.4, 'lb'),
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', '2025-09-09', 182.1, 'lb'),
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', '2025-09-10', 182.4, 'lb'),
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', '2025-09-11', 182.1, 'lb'),
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', '2025-09-12', 182.4, 'lb'),
    ('dff70ba7-9dd9-4743-98fa-bdcf208dc69e', '2025-09-13', 182.1, 'lb');

