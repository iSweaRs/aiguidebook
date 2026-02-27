import mongoose, { Schema, Document, Model } from 'mongoose';

// --- Enums ---
export enum ConversationCategory {
  ACADEMIC = 'ACADEMIC',
  PRIVATE = 'PRIVATE',
}

export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

// --- Interfaces ---
export interface IUser extends Document {
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICourse extends Document {
  name: string;
  code: string;
  userId: mongoose.Types.ObjectId | IUser; // The student managing/taking the course
}

export interface IConversation extends Document {
  title: string;
  category: ConversationCategory;
  userId: mongoose.Types.ObjectId | IUser;
  courseId?: mongoose.Types.ObjectId | ICourse; // Only present if ACADEMIC
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId | IConversation;
  role: Role;
  content: string;
  createdAt: Date;
}

export interface IDocumentFile extends Document {
  conversationId: mongoose.Types.ObjectId | IConversation;
  filename: string;
  contentType: string;
  data: Buffer;
  uploadedAt: Date;
}

export interface IBrainstormIdea extends Document {
  conversationId: mongoose.Types.ObjectId | IConversation;
  prompt: string;
  idea: string;
  createdAt: Date;
}

export interface IBiasReport extends Document {
  messageId: mongoose.Types.ObjectId | IMessage;
  reason: string;
  createdAt: Date;
}

// --- Schemas ---
const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const CourseSchema: Schema = new Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

const ConversationSchema: Schema = new Schema(
  {
    title: { type: String, required: true, default: 'New Conversation' },
    category: {
      type: String,
      enum: Object.values(ConversationCategory),
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: function (this: IConversation) {
        return this.category === ConversationCategory.ACADEMIC;
      },
    },
  },
  { timestamps: true }
);

const MessageSchema: Schema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  role: { type: String, enum: Object.values(Role), required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const DocumentFileSchema: Schema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  data: { type: Buffer, required: true }, // Stores the file securely in the DB
  uploadedAt: { type: Date, default: Date.now },
});

const BrainstormIdeaSchema: Schema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  prompt: { type: String, required: true },
  idea: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const BiasReportSchema: Schema = new Schema({
  messageId: { type: Schema.Types.ObjectId, ref: 'Message', required: true },
  reason: { type: String, default: 'Flagged by user for bias or inappropriate content' },
  createdAt: { type: Date, default: Date.now },
});

// --- Models ---
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const Course: Model<ICourse> = mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
export const Conversation: Model<IConversation> = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
export const Message: Model<IMessage> = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
export const DocumentFile: Model<IDocumentFile> = mongoose.models.DocumentFile || mongoose.model<IDocumentFile>('DocumentFile', DocumentFileSchema);
export const BrainstormIdea: Model<IBrainstormIdea> = mongoose.models.BrainstormIdea || mongoose.model<IBrainstormIdea>('BrainstormIdea', BrainstormIdeaSchema);
export const BiasReport: Model<IBiasReport> = mongoose.models.BiasReport || mongoose.model<IBiasReport>('BiasReport', BiasReportSchema);
