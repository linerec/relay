import React, { useState, useEffect } from 'react';
import { Form, ListGroup } from 'react-bootstrap';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';

interface UserSearchProps {
  onUserSelect: (user: Profile) => void;
  selectedUsers: Profile[];
}

export function UserSearch({ onUserSelect, selectedUsers }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);

  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.length < 2) {
        setSearchResults([]);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', `%${searchTerm}%`)
        .limit(5);

      if (error) {
        console.error('Error searching users:', error);
        return;
      }

      // Filter out already selected users
      const filteredResults = data.filter(
        user => !selectedUsers.some(selected => selected.id === user.id)
      );
      
      setSearchResults(filteredResults);
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedUsers]);

  return (
    <div className="position-relative">
      <Form.Control
        type="text"
        placeholder="Search users by username"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      {searchResults.length > 0 && (
        <ListGroup className="position-absolute w-100 mt-1 shadow-sm">
          {searchResults.map((user) => (
            <ListGroup.Item
              key={user.id}
              action
              onClick={() => {
                onUserSelect(user);
                setSearchTerm('');
                setSearchResults([]);
              }}
              className="d-flex justify-content-between align-items-center"
            >
              <div className="fw-bold">{user.username}</div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
}