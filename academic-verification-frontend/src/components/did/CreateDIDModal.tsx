import { Modal } from '../ui/Modal';
import CreateDIDForm from './CreateDIDForm';
import { useDIDStore } from '@/store/did.store';

interface CreateDIDModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateDIDModal({ isOpen, onClose }: CreateDIDModalProps) {
  const setDID = useDIDStore(state => state.setDID);

  const handleSuccess = (didAddress: string) => {
    // Update store with new DID
    setDID(didAddress, [{
      id: '1',
      keyType: 'Ed25519',
      publicKey: '0x...',
      addedAt: Date.now(),
    }]);
    
    // Close modal
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl"
    >
      <CreateDIDForm 
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    </Modal>
  );
}