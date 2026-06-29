import { Modal, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PickerOption {
  id: string;
  label: string;
  subtitle?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  color?: string;
}

interface PickerModalProps {
  open: boolean;
  onClose: () => void;
  options: PickerOption[];
  selectedId?: string;
  onSelect: (id: string) => void;
  title: string;
}

export default function PickerModal({
  open,
  onClose,
  options,
  selectedId,
  onSelect,
  title,
}: PickerModalProps) {
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity className="flex-1 bg-black/60 justify-end" activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          className="bg-bg-surface rounded-t-3xl max-h-[70%]"
          onPress={() => {}}
        >
          <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-border">
            <Text className="text-text-primary text-lg font-bold">{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#a0a0a0" />
            </TouchableOpacity>
          </View>
          <ScrollView className="px-6 pb-8">
            {options.map((opt) => {
              const selected = opt.id === selectedId;
              return (
                <TouchableOpacity
                  key={opt.id}
                  className={`flex-row items-center py-4 border-b border-border/50 ${selected ? "opacity-100" : "opacity-70"}`}
                  onPress={() => {
                    onSelect(opt.id);
                    onClose();
                  }}
                >
                  {opt.icon && (
                    <View
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: opt.color ? `${opt.color}20` : "#383838" }}
                    >
                      <Ionicons name={opt.icon} size={20} color={opt.color || "#a0a0a0"} />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className={`text-text-primary font-medium ${selected ? "text-primary-300" : ""}`}>
                      {opt.label}
                    </Text>
                    {opt.subtitle && (
                      <Text className="text-text-muted text-sm mt-0.5">{opt.subtitle}</Text>
                    )}
                  </View>
                  {selected && <Ionicons name="checkmark" size={20} color="#c0c0f8" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
