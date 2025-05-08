-- Create Instagram-like API tables

-- Media containers table - stores media items that have been uploaded but may not yet be published
CREATE TABLE IF NOT EXISTS media_containers (
  id VARCHAR PRIMARY KEY NOT NULL,
  user_id INTEGER NOT NULL,
  media_type VARCHAR NOT NULL, -- IMAGE, VIDEO, CAROUSEL_ALBUM
  media_url TEXT NOT NULL,
  caption TEXT,
  status VARCHAR NOT NULL, -- CREATED, PUBLISHED, ERROR
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Post media table - stores published media posts
CREATE TABLE IF NOT EXISTS post_media (
  id SERIAL PRIMARY KEY,
  container_id VARCHAR NOT NULL REFERENCES media_containers(id),
  user_id INTEGER NOT NULL,
  caption TEXT,
  media_type VARCHAR NOT NULL, -- IMAGE, VIDEO, CAROUSEL_ALBUM
  media_url TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  published_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create index for user_id on media_containers
CREATE INDEX IF NOT EXISTS idx_media_containers_user_id ON media_containers(user_id);

-- Create index for user_id on post_media
CREATE INDEX IF NOT EXISTS idx_post_media_user_id ON post_media(user_id);

-- Create index for container_id on post_media
CREATE INDEX IF NOT EXISTS idx_post_media_container_id ON post_media(container_id);