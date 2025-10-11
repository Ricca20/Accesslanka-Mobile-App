import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import {
  Modal,
  Portal,
  Text,
  TextInput,
  Button,
  Chip,
  useTheme,
  HelperText,
} from 'react-native-paper'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

export default function CreatePostModal({ visible, onDismiss, onSubmit }) {
  const theme = useTheme()
  const [category, setCategory] = useState('discussion')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const categories = [
    { key: 'questions', label: 'Question', icon: 'help-circle', color: '#2196F3' },
    { key: 'tips', label: 'Tip', icon: 'lightbulb', color: '#4CAF50' },
    { key: 'discussion', label: 'Discussion', icon: 'forum', color: '#FF9800' },
  ]

  const validateForm = () => {
    const newErrors = {}

    if (!title.trim()) {
      newErrors.title = 'Title is required'
    } else if (title.trim().length < 5) {
      newErrors.title = 'Title must be at least 5 characters'
    } else if (title.trim().length > 200) {
      newErrors.title = 'Title must not exceed 200 characters'
    }

    if (!content.trim()) {
      newErrors.content = 'Content is required'
    } else if (content.trim().length < 10) {
      newErrors.content = 'Content must be at least 10 characters'
    } else if (content.trim().length > 10000) {
      newErrors.content = 'Content must not exceed 10,000 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const postData = {
        category,
        title: title.trim(),
        content: content.trim(),
        tags: tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0),
        image_urls: [],
      }

      await onSubmit(postData)
      handleClear()
      onDismiss()
    } catch (error) {
      console.error('Error submitting post:', error)
      setErrors({ submit: 'Failed to create post. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setCategory('discussion')
    setTitle('')
    setContent('')
    setTags('')
    setErrors({})
  }

  const handleDismiss = () => {
    handleClear()
    onDismiss()
  }

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={handleDismiss}
        contentContainerStyle={styles.modalContainer}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoid}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.header}>

              <Text variant="headlineMedium" style={styles.headerTitle}>
                Create a Post
              </Text>
              <Text variant="bodyMedium" style={styles.headerSubtitle}>
                Share your thoughts, questions, or experiences with the community
              </Text>
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Select Category
                </Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              </View>
              <View style={styles.categoryContainer}>
                {categories.map((cat) => (
                  <Chip
                    key={cat.key}
                    icon={() => <Icon name={cat.icon} size={16} color={category === cat.key ? '#FFFFFF' : cat.color} />}
                    selected={category === cat.key}
                    onPress={() => setCategory(cat.key)}
                    style={[
                      styles.categoryChip,
                      category === cat.key && { backgroundColor: cat.color }
                    ]}
                    textStyle={[
                      styles.categoryChipText,
                      category === cat.key && { color: '#FFFFFF' }
                    ]}
                    mode={category === cat.key ? 'flat' : 'outlined'}
                  >
                    {cat.label}
                  </Chip>
                ))}
              </View>
            </View>

            {/* Title Input */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Post Title
                </Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              </View>
              <TextInput
                label="Enter a descriptive title"
                value={title}
                onChangeText={setTitle}
                mode="outlined"
                placeholder="e.g., Looking for wheelchair-accessible restaurants in Colombo"
                error={!!errors.title}
                maxLength={200}
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor="#2E7D32"
                left={<TextInput.Icon icon="text" color="#2E7D32" />}
              />
              {errors.title ? (
                <HelperText type="error" visible style={styles.helperError}>
                  <Icon name="alert-circle" size={14} color="#B00020" /> {errors.title}
                </HelperText>
              ) : (
                <View style={styles.characterCount}>
                  <Text style={styles.characterCountText}>{title.length}/200 characters</Text>
                </View>
              )}
            </View>

            {/* Content Input */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Post Content
                </Text>
                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredText}>Required</Text>
                </View>
              </View>
              <TextInput
                label="Share your thoughts"
                value={content}
                onChangeText={setContent}
                mode="outlined"
                placeholder="Share your experiences, ask questions, or provide tips about accessibility..."
                error={!!errors.content}
                multiline
                numberOfLines={8}
                maxLength={10000}
                style={[styles.input, styles.contentInput]}
                outlineColor="#E0E0E0"
                activeOutlineColor="#2E7D32"
              />
              {errors.content ? (
                <HelperText type="error" visible style={styles.helperError}>
                  <Icon name="alert-circle" size={14} color="#B00020" /> {errors.content}
                </HelperText>
              ) : (
                <View style={styles.characterCount}>
                  <Text style={styles.characterCountText}>{content.length}/10,000 characters</Text>
                </View>
              )}
            </View>

            {/* Tags Input */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="tag-multiple" size={18} color="#666" />
                <Text variant="titleSmall" style={[styles.sectionTitle, { color: '#666' }]}>
                  Tags
                </Text>
                <View style={[styles.requiredBadge, styles.optionalBadge]}>
                  <Text style={styles.optionalText}>Optional</Text>
                </View>
              </View>
              <TextInput
                label="Add tags"
                value={tags}
                onChangeText={setTags}
                mode="outlined"
                placeholder="wheelchair, ramps, parking, elevators"
                style={styles.input}
                outlineColor="#E0E0E0"
                activeOutlineColor="#2E7D32"
                left={<TextInput.Icon icon="tag-multiple" color="#666" />}
              />
              <View style={styles.tagHelp}>
                <Icon name="information" size={14} color="#666" />
                <Text style={styles.tagHelpText}>
                  Separate tags with commas to help others discover your post
                </Text>
              </View>
            </View>

            {/* Submit Error */}
            {errors.submit && (
              <View style={styles.errorContainer}>
                <Icon name="alert-circle" size={20} color="#B00020" />
                <Text style={styles.errorText}>{errors.submit}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Button
                mode="outlined"
                onPress={handleDismiss}
                style={styles.cancelButton}
                labelStyle={styles.cancelButtonLabel}
                disabled={loading}
                icon="close"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.submitButton}
                labelStyle={styles.submitButtonLabel}
                loading={loading}
                disabled={loading}
                icon="send"
              >
                Publish Post
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </Portal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    maxHeight: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  keyboardAvoid: {
    padding: 24,
  },
  header: {
    marginBottom: 28,
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2E7D32',
    textAlign: 'center',
  },
  headerSubtitle: {
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#2E7D32',
    flex: 1,
  },
  requiredBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  requiredText: {
    color: '#C62828',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  optionalBadge: {
    backgroundColor: '#F5F5F5',
  },
  optionalText: {
    color: '#666',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryChip: {
    marginBottom: 8,
    borderWidth: 2,
  },
  categoryChipText: {
    fontWeight: '600',
    fontSize: 13,
  },
  input: {
    backgroundColor: 'white',
  },
  contentInput: {
    minHeight: 160,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  helperError: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  characterCountText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  tagHelp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5F8FA',
    borderRadius: 8,
  },
  tagHelpText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#B00020',
  },
  errorText: {
    flex: 1,
    color: '#B00020',
    fontSize: 13,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  cancelButton: {
    flex: 1,
    borderColor: '#E0E0E0',
    borderWidth: 2,
    marginBottom: 32,
  },
  cancelButtonLabel: {
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#2E7D32',
    elevation: 2,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 32,
  },
  submitButtonLabel: {
    fontWeight: '600',
    fontSize: 14,
  },
})
